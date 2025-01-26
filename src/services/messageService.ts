import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import type { Chat, Message } from '../types';

export const createOrGetChat = async (currentUserId: string, otherUserId: string) => {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    const existingChat = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants?.includes(otherUserId);
    });

    if (existingChat) {
      return {
        chatId: existingChat.id,
        ...existingChat.data()
      };
    }

    // Create new chat if none exists
    const chatData = {
      participants: [currentUserId, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const newChatRef = await addDoc(chatsRef, chatData);
    return {
      chatId: newChatRef.id,
      ...chatData
    };
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    throw error;
  }
};

export const listenToChats = (
  userId: string,
  onSuccess: (chats: Chat[]) => void,
  onError: (error: Error) => void
) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      onSuccess(chats);
    },
    (error) => {
      console.error('Error in chat listener:', error);
      onError(error);
    }
  );
};

export const sendMessage = async (chatId: string, message: {
  senderId: string;
  receiverId: string;
  content: string;
}) => {
  // Add message
  const messageRef = await addDoc(collection(db, 'messages'), {
    chatId,
    ...message,
    createdAt: serverTimestamp(),
    read: false
  });

  // Update chat's last message
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      content: message.content,
      senderId: message.senderId,
      createdAt: new Date().toISOString()
    },
    updatedAt: serverTimestamp()
  });

  return messageRef;
};

// Get unread message count for a chat
export const getUnreadMessageCount = async (chatId: string, userId: string) => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};