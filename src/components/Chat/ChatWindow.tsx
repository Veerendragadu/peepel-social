import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, limit, doc } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import type { Message, User } from '../../types';

interface ChatWindowProps {
  recipient: User;
  chatId: string | undefined;
  onClose: () => void;
}

export function ChatWindow({ recipient, chatId, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.user);
  const markChatAsRead = useMessageStore((state) => state.markChatAsRead);

  useEffect(() => {
    if (!chatId || !currentUser || !recipient) return;

    setLoading(true);
    setError(null);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeFunc = onSnapshot(messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Message,
          createdAt: doc.data().createdAt?.toDate?.() ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.() ? doc.data().updatedAt.toDate().toISOString() : new Date().toISOString()
        } as Message)).reverse(); // Reverse to show oldest first
        
        setMessages(messagesData);
        setLoading(false);
        
        // Mark messages as read when chat is opened
        markChatAsRead(chatId);
        
        // Scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (error) => {
        console.error('Error in messages listener:', error);
        setError('Failed to load messages');
        setLoading(false);
      }
    );
    
    return () => unsubscribeFunc();
  }, [chatId, currentUser, recipient]);

  const handleSendMessage = async (content: string) => {
    if (!chatId || !currentUser || !content.trim() || sending) return;

    const docRef = doc(db, 'chats', chatId);
    const trimmedContent = content.trim();
    setSending(true);
    setError(null);
    
    // Encode the content to preserve emojis
    const encodedContent = encodeURIComponent(trimmedContent);
    
    const messageData = {
      chatId,
      content: decodeURIComponent(encodedContent), // Store decoded content
      senderId: currentUser.id,
      receiverId: recipient.id,
      createdAt: serverTimestamp(),
      read: false
    };

    try {
      const messageRef = await addDoc(collection(db, 'messages'), messageData);

      // Update chat's last message
      await updateDoc(docRef, {
        lastMessage: {
          content: decodeURIComponent(encodedContent), // Store decoded content
          senderId: currentUser.id
        },
        updatedAt: serverTimestamp()
      });

      // Scroll to bottom after sending
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error sending message:', error instanceof Error ? error.message : error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser || !recipient) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <img
            src={recipient.avatar}
            alt={recipient.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-white">{recipient.name}</h3>
            <p className="text-sm text-white/60">@{recipient.username}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 mx-4 mt-4 rounded-lg">
          <p className="text-red-500 text-sm text-center">
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-[#6b9ded] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === currentUser.id}
              sender={message.senderId === currentUser.id ? currentUser : recipient}
            />
          ))
        ) : (
          <div className="text-center text-white/60 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} disabled={loading || sending} />
      </div>
    </div>
  );
}