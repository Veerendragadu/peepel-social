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
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import type { Chat, Message } from '../types';

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

export const createChat = async (participants: string[]) => {
  return addDoc(collection(db, 'chats'), {
    participants,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
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

export const listenToMessages = (
  chatId: string,
  onSuccess: (messages: Message[]) => void,
  onError: (error: Error) => void
) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      onSuccess(messages);
    },
    (error) => {
      console.error('Error in messages listener:', error);
      onError(error);
    }
  );
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const messagesRef = collection(db, 'messages');
  const unreadMessages = await getDocs(
    query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    )
  );

  const updatePromises = unreadMessages.docs.map(doc =>
    updateDoc(doc.ref, { read: true })
  );

  await Promise.all(updatePromises);
};