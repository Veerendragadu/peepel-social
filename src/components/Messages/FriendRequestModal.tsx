import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { listenToFriendRequests, respondToFriendRequest } from '../../services/friendService';
import type { FriendRequest, User } from '../../types';

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestModal({ isOpen, onClose }: FriendRequestModalProps) {
  const [friendRequests, setFriendRequests] = useState<(FriendRequest & { sender: User })[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to friend requests in real-time
    const unsubscribe = listenToFriendRequests(currentUser.id, (requests) => {
      // Fetch sender details for each request
      Promise.all(
        requests.map(async (request) => {
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('id', '==', request.senderId))
          );
          const senderData = userDoc.docs[0]?.data() as User;
          return {
            ...request,
            sender: {
              id: request.senderId,
              ...senderData
            }
          };
        })
      ).then(setFriendRequests);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await respondToFriendRequest(requestId, 'accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await respondToFriendRequest(requestId, 'rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-background/95 z-20">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Friend Requests</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        {friendRequests.length > 0 ? (
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={request.sender.avatar}
                    alt={request.sender.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-white font-medium">{request.sender.name}</p>
                    <p className="text-sm text-white/60">@{request.sender.username}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={loading}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={loading}
                    className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
              <UserPlus className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-white/60">No friend requests</p>
          </div>
        )}
      </div>
    </div>
  );
}