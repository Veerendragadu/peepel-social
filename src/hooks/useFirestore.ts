import { useEffect, useState } from 'react';
import { 
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

export function useFirestoreQuery<T>(
  path: string,
  constraints: QueryConstraint[],
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const q = query(collection(db, path), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: T[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching ${path}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, deps);

  return { data, loading, error };
}

export function useChat(chatId: string | null) {
  return useFirestoreQuery(
    'messages',
    [
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    ],
    [chatId]
  );
}

export function useUserChats(userId: string | null) {
  return useFirestoreQuery(
    'chats',
    [
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    ],
    [userId]
  );
}