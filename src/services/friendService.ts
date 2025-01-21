import { db } from '../lib/firebaseClient';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import type { User, FriendRequest } from '../types';

export const searchUsers = async (searchTerm: string, currentUserId: string) => {
  const usersRef = collection(db, 'users');
  const searchTermLower = searchTerm.toLowerCase();
  
  // First try exact username match
  const exactMatchQuery = query(
    usersRef,
    where('username', '>=', searchTermLower),
    where('username', '<=', searchTermLower + '\uf8ff'),
    orderBy('username'),
    limit(10)
  );

  const snapshot = await getDocs(exactMatchQuery);
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as User))
    .filter(user => user.id !== currentUserId);

  // If no exact matches, try search terms
  if (results.length === 0) {
    const searchTermsQuery = query(
      usersRef,
      where('searchTerms', 'array-contains', searchTermLower),
      orderBy('username'),
      limit(10)
    );

    const searchTermsSnapshot = await getDocs(searchTermsQuery);
    const searchTermsResults = searchTermsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as User))
      .filter(user => user.id !== currentUserId);

    return searchTermsResults;
  }

  return results;
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  const friendRequestsRef = collection(db, 'friendRequests');
  
  // Check if request already exists
  const existingRequest = await getDocs(
    query(
      friendRequestsRef,
      where('senderId', '==', senderId),
      where('receiverId', '==', receiverId),
      where('status', '==', 'pending')
    )
  );

  if (!existingRequest.empty) {
    throw new Error('Friend request already sent');
  }

  return addDoc(friendRequestsRef, {
    senderId,
    receiverId,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

export const respondToFriendRequest = async (
  requestId: string, 
  response: 'accepted' | 'rejected'
) => {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, {
    status: response,
    updatedAt: serverTimestamp()
  });
};

export const listenToFriendRequests = (
  userId: string,
  callback: (requests: FriendRequest[]) => void
) => {
  const friendRequestsRef = collection(db, 'friendRequests');
  const q = query(
    friendRequestsRef,
    where('receiverId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest));
    callback(requests);
  });
};

export const getFriends = async (userId: string) => {
  const friendRequestsRef = collection(db, 'friendRequests');
  const acceptedRequests = await getDocs(
    query(
      friendRequestsRef,
      where('status', '==', 'accepted'),
      where('participants', 'array-contains', userId)
    )
  );

  const friendIds = new Set<string>();
  acceptedRequests.docs.forEach(doc => {
    const data = doc.data();
    if (data.senderId === userId) {
      friendIds.add(data.receiverId);
    } else {
      friendIds.add(data.senderId);
    }
  });

  const friends: User[] = [];
  for (const friendId of friendIds) {
    const userDoc = await getDocs(
      query(collection(db, 'users'), where('id', '==', friendId))
    );
    if (!userDoc.empty) {
      friends.push({ id: friendId, ...userDoc.docs[0].data() } as User);
    }
  }

  return friends;
};