import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import type { User } from '../types';
import { onSnapshot } from 'firebase/firestore';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const trimmedUsername = username.trim().toLowerCase();
    console.log('Checking username:', trimmedUsername);

    // Basic validation
    if (!trimmedUsername || trimmedUsername.length < 3) {
      console.log('Username too short');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      console.log('Invalid username format');
      return false;
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '==', trimmedUsername),
      limit(1)
    );

    const snapshot = await getDocs(q);
    const isAvailable = snapshot.empty;
    console.log('Username available:', isAvailable);
    return isAvailable;

  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
}

export async function searchUsers(searchTerm: string, currentUserId: string, maxResults = 10): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const searchTermLower = searchTerm.toLowerCase();
    
    // Query users by username
    const searchQuery = query(
      usersRef,
      where('username', '>=', searchTermLower),
      where('username', '<=', searchTermLower + '\uf8ff'),
      orderBy('username'),
      limit(maxResults)
    );

    const snapshot = await getDocs(searchQuery);
    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
      .filter(user => user.id !== currentUserId); // Filter out current user

    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

export function subscribeToUserSearch(
  searchTerm: string,
  currentUserId: string,
  onResults: (users: User[]) => void,
  onError: (error: Error) => void,
  maxResults = 10
) {
  const usersRef = collection(db, 'users');
  const searchTermLower = searchTerm.toLowerCase();
  
  const searchQuery = query(
    usersRef,
    where('username', '>=', searchTermLower),
    where('username', '<=', searchTermLower + '\uf8ff'),
    orderBy('username'),
    limit(maxResults)
  );

  return onSnapshot(
    searchQuery,
    (snapshot) => {
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User))
        .filter(user => user.id !== currentUserId);
      onResults(results);
    },
    onError
  );
}