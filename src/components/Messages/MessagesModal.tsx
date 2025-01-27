import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Smile, Search, UserPlus, Users, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { sendFriendRequest, getFriendRequestStatus } from '../../services/friendService';
import { createOrGetChat, getUnreadMessageCount } from '../../services/messageService';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import type { Chat, User } from '../../types';
import { ChatWindow } from '../Chat/ChatWindow';
import { searchUsers } from '../../services/userService';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const [showChatList, setShowChatList] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [requestStates, setRequestStates] = useState<Record<string, {
    status: 'none' | 'sent' | 'received';
    isFriend: boolean;
    loading: boolean;
  }>>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);
  const [unsubscribeChats, setUnsubscribeChats] = useState<(() => void) | null>(null);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [unreadCountsListener, setUnreadCountsListener] = useState<(() => void) | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationStack, setNavigationStack] = useState<string[]>(['list']);
  
  // Listen for openMessagesWith event
  useEffect(() => {
    // Add a history entry when opening messages to enable back button
    if (isOpen) {
      window.history.pushState({ modal: 'messages' }, '');
    }

    const handleOpenMessages = async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        const selectedUser = customEvent.detail.user;
        console.log('Opening chat with user:', selectedUser);

        try {
          // Ensure we're in the right state
          setShowSearch(false);
          setShowChatList(false);
          
          setChatsLoading(true);
          if (!user?.id) throw new Error('No user ID available');
          
          const chat = await createOrGetChat(user.id, selectedUser.id);
          console.log('Created/got chat:', chat);

          // Update states in sequence
          setTimeout(() => {
            setActiveChatId(chat.chatId);
            setActiveChatUser(selectedUser);
            setNavigationStack(prev => [...prev, 'chat']);
          }, 0);
        } catch (error) {
          console.error('Error creating chat:', error);
          setChatsError('Failed to create chat');
        } finally {
          setChatsLoading(false);
        }
      } else {
        // Otherwise show search
        setShowSearch(true);
        setShowChatList(false);
        setNavigationStack(prev => [...prev, 'search']);
      }
    };

    const handleOpenMessagesWrapper = (e: Event) => {
      e.preventDefault();
      handleOpenMessages(e as CustomEvent);
    };

    window.addEventListener('openMessagesWith', handleOpenMessagesWrapper);
    window.addEventListener('openMessages', handleOpenMessagesWrapper);

    return () => {
      window.removeEventListener('openMessagesWith', handleOpenMessagesWrapper);
      window.removeEventListener('openMessages', handleOpenMessagesWrapper);
    };
  }, [isOpen, user]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      // Check if we're handling a messages modal state
      if (window.history.state?.modal === 'messages') {
        // Prevent default back behavior
        window.history.pushState({ modal: 'messages' }, '');
        handleBack();
      } else {
        // Close modal if we're going back from the initial state
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update unread counts when chats change
  useEffect(() => {
    if (!user || chats.length === 0) return;

    // Clean up previous listener
    if (unreadCountsListener) {
      unreadCountsListener();
    }

    // Set up real-time listener for unread messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const counts: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const chatId = doc.data().chatId;
        counts[chatId] = (counts[chatId] || 0) + 1;
      });

      setUnreadCounts(counts);
    });

    setUnreadCountsListener(() => unsubscribe);
    return () => unsubscribe();
  }, [user, chats]);


  // Check friend status for search results
  useEffect(() => {
    if (!user || searchResults.length === 0) return;

    const checkFriendStatus = async () => {
      const newRequestStates = { ...requestStates };

      for (const result of searchResults) {
        try {
          // Check if they're already friends
          const isFriend = user.friends?.includes(result.id) || false;
          
          if (!isFriend) {
            // Only check request status if they're not friends
            const status = await getFriendRequestStatus(user.id, result.id);
            newRequestStates[result.id] = {
              status: status.type,
              isFriend: false,
              loading: false
            };
          } else {
            newRequestStates[result.id] = {
              status: 'none',
              isFriend: true,
              loading: false
            };
          }
        } catch (error) {
          console.error('Error checking friend status:', error);
          newRequestStates[result.id] = {
            status: 'none',
            isFriend: false,
            loading: false
          };
        }
      }

      setRequestStates(newRequestStates);
    };

    checkFriendStatus();
  }, [user, searchResults]);

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user || sendingFriendRequest) return;
    
    // Update request state immediately for better UX
    setRequestStates(prev => ({
      ...prev,
      [receiverId]: { ...prev[receiverId], status: 'sent', loading: true }
    }));
    
    try {
      setSendingFriendRequest(true);
      await sendFriendRequest(user.id, receiverId);
      
      // Update request state after success
      setRequestStates(prev => ({
        ...prev,
        [receiverId]: { ...prev[receiverId], status: 'sent', loading: false }
      }));
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      setSearchError('Failed to send friend request');
      
      // Reset request state on error
      setRequestStates(prev => ({
        ...prev,
        [receiverId]: { ...prev[receiverId], status: 'none', loading: false }
      }));
      
    } finally {
      setSendingFriendRequest(false);
    }
  };

  // Load user's chats
  useEffect(() => {
    if (!user) return;

    // Cleanup previous subscription
    if (unsubscribeChats) {
      unsubscribeChats();
      setUnsubscribeChats(null);
    }

    // Load chats from Firebase
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeFunc = onSnapshot(chatsQuery, 
      async (snapshot) => {
        try {
          // Get all unique participant IDs first
          const participantIds = new Set<string>();
          snapshot.docs.forEach(doc => {
            const participants = doc.data().participants || [];
            participants.filter(Boolean).forEach((id: string) => {
              if (id !== user.id) participantIds.add(id);
            });
          });

          // Fetch user data for each participant
          const newUserMap = new Map(userMap);
          for (const participantId of participantIds) {
            if (!newUserMap.has(participantId)) {
              const userDoc = await getDocs(query(
                collection(db, 'users'),
                where('id', '==', participantId)
              ));
              if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                newUserMap.set(participantId, { id: participantId, ...userData });
              }
            }
          }
          setUserMap(newUserMap);

          // Map chats with user data
          const validChats = snapshot.docs.map(doc => {
            const chatData = doc.data();
            const otherUserId = chatData.participants?.find((id: string) => id !== user.id);
            const otherUser = newUserMap.get(otherUserId);

            if (!otherUser) return null;

            return {
              id: doc.id,
              ...chatData,
              otherUser,
              createdAt: chatData.createdAt?.toDate?.() ? chatData.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: chatData.updatedAt?.toDate?.() ? chatData.updatedAt.toDate().toISOString() : new Date().toISOString()
            };
          }).filter(Boolean);

          setChats(validChats);
          setChatsLoading(false);
          setChatsError(null);
        } catch (error) {
          console.error('Error loading chats:', error);
          setChatsError('Failed to load chats');
          setChatsLoading(false);
        }
      },
      (error) => {
        console.error('Error in chat listener:', error);
        setChatsError('Failed to load chats');
        setChatsLoading(false);
      }
    );

    setUnsubscribeChats(() => unsubscribeFunc);
    return () => {
      if (unsubscribeChats) {
        unsubscribeChats();
      }
    };
  }, [user]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery || !user || trimmedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const results = await searchUsers(trimmedQuery, user.id);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchError('Failed to search users');
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, user]);

  const handleUserSelect = async (selectedUser: User) => {
    if (!selectedUser || !user) return;
    
    // Prevent event bubbling
    event?.stopPropagation?.();
    
    console.log('Selecting user for chat:', selectedUser);
    setChatsLoading(true);
    
    try {
      if (!user.id) throw new Error('No user ID available');
      
      // Create or get chat
      const chat = await createOrGetChat(user.id, selectedUser.id);
      console.log('Created/got chat with ID:', chat.chatId);

      // Update all states in a single batch to prevent race conditions
      setActiveChatId(chat.chatId);
      setActiveChatUser(selectedUser);
      setShowSearch(false);
      setShowChatList(false);
      setSearchQuery('');
      setSearchResults([]);
      setNavigationStack(prev => [...prev, 'chat']);
      
    } catch (error) {
      console.error('Error creating chat:', error);
      setChatsError('Failed to create chat');
    } finally {
      setChatsLoading(false);
    }
  };

  const handleMessageClick = async (friend: User, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Message click for friend:', friend);
    await handleUserSelect(friend);
  };

  const handleBack = () => {
    // Remove current view from navigation stack
    setNavigationStack(prev => prev.slice(0, -1));
    const lastView = navigationStack[navigationStack.length - 2];

    if (activeChatUser) {
      setActiveChatId(null);
      setActiveChatUser(null);
      setShowSearch(false);
      setShowChatList(true);
      // Clear unread count for this chat
      setUnreadCounts(prev => ({
        ...prev,
        [activeChatId!]: 0
      }));
    } else {
      setShowSearch(false);
      setShowChatList(true);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center space-x-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        {(showSearch || activeChatUser) && (
          <button
            onClick={handleBack}
            className="mr-3 p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg font-semibold text-white">
          {showSearch ? 'Find Friends' : 'Messages'}
        </h2>
        <button
          onClick={onClose}
          className="ml-auto p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {showChatList && !showSearch && !activeChatUser && (
          <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {chatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : chatsError ? (
              <div className="text-center py-8">
                <p className="text-white/60">{chatsError}</p>
                <button
                  onClick={() => {
                    setChatsLoading(true);
                    setChatsError(null);
                  }}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : chats.length > 0 ? (
              chats.map((chat) => {
                const otherUser = chat.otherUser;
                if (!otherUser) return null;

                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setActiveChatUser(otherUser);
                      setNavigationStack(prev => [...prev, 'chat']);
                      setTimeout(() => setShowChatList(false), 0);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      activeChatId === chat.id
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">
                          {otherUser.name}
                        </span>
                        {unreadCounts[chat.id] > 0 && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="text-sm text-white/40">
                          {chat.lastMessage?.createdAt &&
                            formatDistanceToNow(typeof chat.lastMessage.createdAt === 'string' ? 
                              new Date(chat.lastMessage.createdAt) :
                              chat.lastMessage.createdAt?.toDate?.() || new Date(), {
                              addSuffix: true,
                            })}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${unreadCounts[chat.id] > 0 ? 'text-white font-medium' : 'text-white/60'}`}>
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No chats yet</p>
                <button
                  onClick={() => { 
                    setShowSearch(true); 
                    setShowChatList(false);
                    setNavigationStack(prev => [...prev, 'search']);
                  }}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Find Friends
                </button>
              </div>
            )}
          </div>
        )}

        {showSearch && !activeChatUser && (
          <div className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for friends..."
                  className="w-full h-12 px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary text-base"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              </div>
            </div>

            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : searchError ? (
              <div className="text-center py-8">
                <p className="text-white/60">{searchError}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex flex-col sm:flex-row gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <img
                        src={result.avatar}
                        alt={result.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{result.name}</p>
                        <p className="text-sm text-white/60 truncate">@{result.username}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {requestStates[result.id]?.isFriend ? (
                        <button 
                          onClick={() => handleUserSelect(result)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
                        > 
                          <MessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleUserSelect(result)}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
                          > 
                            <MessageSquare className="w-4 h-4" />
                            <span>Message</span>
                          </button>
                          {requestStates[result.id]?.status === 'sent' ? (
                            <button
                              disabled
                              className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary/50 text-white/70 rounded-lg cursor-not-allowed w-full sm:w-auto"
                            >
                              <span>Request Sent</span>
                            </button>
                          ) : requestStates[result.id]?.status === 'received' ? (
                            <button
                              disabled
                              className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary/50 text-white/70 rounded-lg cursor-not-allowed w-full sm:w-auto"
                            >
                              <span>Pending Response</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(result.id)}
                              disabled={requestStates[result.id]?.loading}
                              className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>
                                {requestStates[result.id]?.loading ? 'Sending...' : 'Add Friend'}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No users found</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Search for users to connect</p>
              </div>
            )}
          </div>
        )}
        
        {showChatList && !showSearch && !activeChatUser && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => { 
                setShowSearch(true); 
                setShowChatList(false);
                setNavigationStack(prev => [...prev, 'search']);
              }}
              className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:opacity-90 transition-all"
            >
              <UserPlus className="w-6 h-6" />
            </button>
          </div>
        )}

        {activeChatUser && activeChatId && (
          <ChatWindow
            recipient={activeChatUser}
            chatId={activeChatId}
            onClose={() => {
              setActiveChatId(null);
              setActiveChatUser(null);
              setShowChatList(true);
            }}
          />
        )}
      </div>
    </div>
  );
}