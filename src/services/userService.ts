import { db } from '../lib/firebaseClient';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    if (!username || username.length < 3) return false;
    
    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check for valid characters (letters, numbers, underscores)
    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return false;
    }
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('username', '==', normalizedUsername),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    // Important: Check if the query was successful before returning result
    if (snapshot === null) {
      throw new Error('Failed to check username');
    }
    
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // Instead of returning false, throw error to handle it in the UI
    throw error;
  }
}