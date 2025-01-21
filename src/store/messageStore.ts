import { create } from 'zustand';
import { db, auth } from '../lib/firebaseClient';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import type { Message, Chat, User } from '../types';

interface MessageState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  unreadMessages: Record<string, number>;
  loading: boolean;
  error: string | null;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, senderId: string, receiverId: string) => Promise<void>;
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  initializeChats: (userId: string) => () => void;
  initializeMessages: (chatId: string) => () => void;
  markChatAsRead: (chatId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  chats: [],
  messages: {},
  activeChat: null,
  unreadMessages: {},
  loading: false,
  error: null,

  setActiveChat: (chatId) => {
    set({ activeChat: chatId });
    if (chatId) {
      get().markChatAsRead(chatId).catch(console.error);
    }
  },

  sendMessage: async (chatId, content, senderId, receiverId) => {
    try {
      set({ loading: true, error: null });

      // Add new message first
      const messageRef = await addDoc(collection(db, 'messages'), {
        chatId,
        senderId,
        receiverId,
        content,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update chat's last message
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content,
          senderId,
          createdAt: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      });

      set({ loading: false });
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'Failed to send message', loading: false });
      throw error;
    }
  },

  setChats: (chats) => set({ chats }),
  
  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  initializeChats: (userId) => {
    // Create query for user's chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(chatsQuery, 
      (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage,
            updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
          });
        });
        set({ chats: chats.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )});
      },
      (error) => {
        console.error('Error fetching chats:', error);
        set({ error: 'Failed to load chats' });
      }
    );

    return unsubscribe;
  },

  initializeMessages: (chatId) => {
    // Create query for chat messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(messagesQuery,
      (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            chatId: data.chatId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            read: data.read
          });
        });
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: messages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          }
        }));
      },
      (error) => {
        console.error('Error fetching messages:', error);
        set({ error: 'Failed to load messages' });
      }
    );

    return unsubscribe;
  },

  markChatAsRead: async (chatId) => {
    if (!auth.currentUser) return;

    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);
      
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('receiverId', '==', auth.currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(messagesQuery);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();

      set((state) => ({
        unreadMessages: {
          ...state.unreadMessages,
          [chatId]: 0
        },
        loading: false
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
      set({ error: 'Failed to mark messages as read', loading: false });
    }
  }
}));