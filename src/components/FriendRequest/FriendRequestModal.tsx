import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { listenToFriendRequests, respondToFriendRequest } from '../../services/friendService';
import type { FriendRequest } from '../../types';

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestModal({ isOpen, onClose }: FriendRequestModalProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToFriendRequests(user.id, (newRequests) => {
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAccept = async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      await respondToFriendRequest(requestId, 'accepted');
      setSuccessMessage('Friend request accepted!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      await respondToFriendRequest(requestId, 'rejected');
      setSuccessMessage('Friend request rejected');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setError('Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/95 rounded-xl shadow-xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Friend Requests</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-500 text-sm">{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={request.sender?.avatar}
                      alt={request.sender?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium">{request.sender?.name}</p>
                      <p className="text-sm text-white/60">@{request.sender?.username}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span className="sm:hidden">Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span className="sm:hidden">Reject</span>
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
    </div>
  );
}