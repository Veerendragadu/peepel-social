import React, { useState, useEffect } from 'react';
import { X, Send, Smile, Menu, Search, UserPlus, Users, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { listenToChats } from '../../services/messageService';
import { searchUsers, sendFriendRequest } from '../../services/friendService';
import type { Chat, User } from '../../types';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showFriendList, setShowFriendList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requestSending, setRequestSending] = useState<Record<string, boolean>>({});
  
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user || !isOpen) return;

    const unsubscribe = listenToChats(
      user.id,
      (updatedChats) => {
        setChats(updatedChats);
        setChatsLoading(false);
        setChatError(null);
      },
      (error) => {
        console.error('Error loading chats:', error);
        setChatsLoading(false);
        setChatError('Failed to load chats. Please try again later.');
      }
    );

    return () => unsubscribe();
  }, [user, isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (!searchQuery.trim() || !user) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const results = await searchUsers(searchQuery, user.id);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchError('Failed to search users. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, user]);

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    setRequestSending(prev => ({ ...prev, [receiverId]: true }));
    try {
      await sendFriendRequest(user.id, receiverId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setRequestSending(prev => ({ ...prev, [receiverId]: false }));
    }
  };

  const handleBack = () => {
    setShowFriendList(false);
    setShowChatList(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 z-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center">
        {showFriendList && (
          <button
            onClick={handleBack}
            className="mr-3 p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg font-semibold text-white">
          {showFriendList ? 'Find Friends' : 'Messages'}
        </h2>
        <button
          onClick={onClose}
          className="ml-auto p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showChatList && (
          <div className="p-4 space-y-4">
            {chatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : chatError ? (
              <div className="text-center py-8">
                <p className="text-white/60">{chatError}</p>
                <button
                  onClick={() => {
                    setChatsLoading(true);
                    setChatError(null);
                  }}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : chats.length > 0 ? (
              chats.map((chat) => {
                const otherUserId = chat.participants.find(id => id !== user?.id);
                const otherUser = searchResults.find(u => u.id === otherUserId);

                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      activeChat === chat.id
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={otherUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUserId}`}
                      alt={otherUser?.name || 'User avatar'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">
                          {otherUser?.name || 'Unknown User'}
                        </span>
                        <span className="text-sm text-white/40">
                          {chat.lastMessage?.createdAt &&
                            formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                              addSuffix: true,
                            })}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 truncate">
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
                    setShowChatList(false);
                    setShowFriendList(true);
                  }}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Find Friends
                </button>
              </div>
            )}
          </div>
        )}

        {showFriendList && (
          <div className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for users..."
                  className="w-full h-10 px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
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
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={result.avatar}
                        alt={result.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-white">{result.name}</p>
                        <p className="text-sm text-white/60">@{result.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(result.id)}
                      disabled={requestSending[result.id]}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {requestSending[result.id] ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </button>
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
      </div>
    </div>
  );
}