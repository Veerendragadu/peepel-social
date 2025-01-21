import { 
  collection, 
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import type { User, Message, Chat } from '../types';

// Generic type for converting Firestore documents
const convertDoc = <T>(doc: QueryDocumentSnapshot<DocumentData>): T => {
  return { id: doc.id, ...doc.data() } as T;
};

// Users
export const createUser = async (userId: string, userData: {
  email: string;
  username: string;
  name: string;
  avatar: string;
}) => {
  const searchTerms = generateSearchTerms(userData.username);
  
  await updateDoc(doc(db, 'users', userId), {
    ...userData,
    searchTerms,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isAdmin: false,
    isBanned: false
  });
};

export const searchUsers = async (searchTerm: string, maxResults: number = 10) => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('searchTerms', 'array-contains', searchTerm.toLowerCase()),
    orderBy('username'),
    limit(maxResults)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertDoc<User>(doc));
};

// Chats
export const createChat = async (participants: string[]) => {
  return addDoc(collection(db, 'chats'), {
    participants,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getUserChats = async (userId: string) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertDoc<Chat>(doc));
};

// Messages
export const sendMessage = async (chatId: string, message: {
  senderId: string;
  receiverId: string;
  content: string;
}) => {
  const batch = writeBatch(db);

  // Add message
  const messageRef = doc(collection(db, 'messages'));
  batch.set(messageRef, {
    ...message,
    chatId,
    createdAt: serverTimestamp(),
    read: false
  });

  // Update chat's last message
  const chatRef = doc(db, 'chats', chatId);
  batch.update(chatRef, {
    lastMessage: {
      content: message.content,
      senderId: message.senderId,
      createdAt: new Date().toISOString()
    },
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  return messageRef;
};

export const getChatMessages = async (chatId: string) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertDoc<Message>(doc));
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const batch = writeBatch(db);
  
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    where('receiverId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  
  await batch.commit();
};

// Helper functions
const generateSearchTerms = (username: string): string[] => {
  const terms = new Set<string>();
  const lowerUsername = username.toLowerCase();
  
  // Add full username
  terms.add(lowerUsername);
  
  // Add each prefix
  for (let i = 1; i <= lowerUsername.length; i++) {
    terms.add(lowerUsername.slice(0, i));
  }
  
  // Add each word if username contains spaces
  if (lowerUsername.includes(' ')) {
    lowerUsername.split(' ').forEach(word => {
      if (word) terms.add(word);
    });
  }
  
  return Array.from(terms);
};