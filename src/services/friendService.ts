import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  addDoc, 
  updateDoc,
  doc as firestoreDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  writeBatch,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import type { User, FriendRequest } from '../types';

// Send friend request
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    // Update sender's sent requests
    const senderRef = firestoreDoc(db, 'users', senderId);
    await updateDoc(senderRef, {
      'friendRequests.sent': arrayUnion(receiverId)
    });

    // Update receiver's received requests
    const receiverRef = firestoreDoc(db, 'users', receiverId);
    await updateDoc(receiverRef, {
      'friendRequests.received': arrayUnion(senderId)
    });

    // Check if request already exists
    const existingRequest = await checkExistingRequest(senderId, receiverId);
    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Create new request
    const requestRef = await addDoc(collection(db, 'friendRequests'), {
      senderId,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return requestRef.id;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Check if request exists
const checkExistingRequest = async (senderId: string, receiverId: string) => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('senderId', '==', senderId),
    where('receiverId', '==', receiverId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Get friend request status
export const getFriendRequestStatus = async (userId: string, otherUserId: string) => {
  const requestsRef = collection(db, 'friendRequests');
  
  // Check sent requests
  const sentQuery = query(
    requestsRef,
    where('senderId', '==', userId),
    where('receiverId', '==', otherUserId)
  );
  
  // Check received requests
  const receivedQuery = query(
    requestsRef,
    where('senderId', '==', otherUserId),
    where('receiverId', '==', userId)
  );

  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery)
  ]);

  if (!sentSnapshot.empty) {
    return { type: 'sent', status: sentSnapshot.docs[0].data().status };
  }

  if (!receivedSnapshot.empty) {
    return { type: 'received', status: receivedSnapshot.docs[0].data().status };
  }

  return { type: 'none', status: null };
};

// Respond to friend request
export const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'rejected') => {
  try {
    const batch = writeBatch(db);
    
    // Get request document first
    const requestRef = firestoreDoc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }
    const requestData = requestDoc.data();
    
    // Get user references
    const senderRef = firestoreDoc(db, 'users', requestData.senderId);
    const receiverRef = firestoreDoc(db, 'users', requestData.receiverId);
    
    // Get current user data
    const [senderDoc, receiverDoc] = await Promise.all([
      getDoc(senderRef),
      getDoc(receiverRef)
    ]);

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    if (!senderData || !receiverData) {
      throw new Error('User data not found');
    }
    
    // Remove request from tracking arrays
    batch.update(senderRef, {
      'friendRequests.sent': arrayRemove(requestData.receiverId)
    });
    
    batch.update(receiverRef, {
      'friendRequests.received': arrayRemove(requestData.senderId)
    });

    // Update request status
    batch.update(requestRef, {
      status: response,
      updatedAt: serverTimestamp()
    });

    if (response === 'accepted') {
      // Update sender's data with friends and counts
      batch.update(senderRef, {
        friends: [...(senderData?.friends || []), requestData.receiverId],
        following: (senderData?.following || 0) + 1
      });

      // Update receiver's data with friends and counts
      batch.update(receiverRef, {
        friends: [...(receiverData?.friends || []), requestData.senderId],
        followers: (receiverData?.followers || 0) + 1
      });
    }

    // Update request status
    batch.update(requestRef, {
      status: response,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error responding to friend request:', error);
    throw error;
  }
};

// Listen to friend requests
export const listenToFriendRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('receiverId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    Promise.all(
      snapshot.docs.map(async (doc) => {
        try {
          const data = doc.data();
          const senderDoc = await getDoc(firestoreDoc(db, 'users', data.senderId));
          
          if (senderDoc.exists()) {
            return {
              id: doc.id,
              ...data,
              sender: {
                id: senderDoc.id,
                ...senderDoc.data()
              } as User,
              createdAt: data.createdAt?.toDate?.() 
                ? data.createdAt.toDate().toISOString() 
                : new Date().toISOString()
            } as FriendRequest;
          }
          return null;
        } catch (error) {
          console.error('Error fetching sender details:', error);
          return null;
        }
      })
    )
    .then((results) => {
      const validRequests = results.filter((req): req is FriendRequest => req !== null);
      callback(validRequests);
    })
    .catch((error) => {
      console.error('Error processing friend requests:', error);
      callback([]);
    });
  });
};

// Get user's friends
export const getFriends = async (userId: string): Promise<User[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const friendIds = userDoc.data().friends || [];
    if (friendIds.length === 0) {
      return [];
    }

    const friends: User[] = [];
    for (const friendId of friendIds) {
      const friendRef = doc(db, 'users', friendId);
      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        friends.push({
          id: friendDoc.id,
          ...friendDoc.data()
        } as User);
      }
    }

    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};