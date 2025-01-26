import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Home, LogOut, MessageSquare, UserPlus, Users, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { Post } from '../components/Post';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { getFriends } from '../services/friendService';
import type { User } from '../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [showFriendList, setShowFriendList] = useState(false);
  
  const posts = usePostStore((state) => 
    state.posts.filter((post) => post.userId === (profileUser?.id || currentUser?.id))
  );

  useEffect(() => {
    const loadFriends = async () => {
      if (!profileUser && !currentUser) return;
      setLoadingFriends(true);
      try {
        const userId = profileUser?.id || currentUser?.id;
        if (!userId) return;

        const friendsList = await getFriends(userId);
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, [profileUser, currentUser]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      // If viewing own profile, use current user data
      if (currentUser?.username === username) {
        setProfileUser(currentUser);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Query for user by username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        const userData = snapshot.docs[0].data();
        setProfileUser({
          id: snapshot.docs[0].id,
          ...userData
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [username, currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleMessage = (friend: User) => {
    // Trigger message modal with selected friend
    const event = new CustomEvent('openMessagesWith', { 
      detail: { user: friend }
    });
    window.dispatchEvent(event);
  };

  if (loading) return <div className="min-h-screen bg-background pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/60">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24">
      <button
        onClick={() => navigate('/')}
        className="fixed top-20 left-4 md:left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/10 transition-colors group z-40"
      >
        <Home className="w-5 h-5 text-white/70 group-hover:text-white" />
      </button>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {(profileUser || currentUser) && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center justify-between w-full md:w-auto">
              <img
                src={profileUser?.avatar || currentUser?.avatar}
                alt={profileUser?.name || currentUser?.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-2 ring-primary/20"
              />
              {currentUser?.username === username && (
                <button
                  onClick={handleLogout}
                  className="md:hidden p-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{profileUser?.name || currentUser?.name}</h1>
              <p className="text-white/60">@{profileUser?.username || currentUser?.username}</p>
              <p className="mt-2 text-white/80">{profileUser?.bio || currentUser?.bio}</p>
              <div className="mt-4 flex flex-wrap gap-6">
                <button
                  onClick={() => setShowFriendList(true)}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-bold">{friends.length}</span>
                  <span className="text-white/60">Friends</span>
                </button>
              </div>
              {currentUser?.username === username && (
                <button
                  onClick={handleLogout}
                  className="hidden md:flex mt-4 p-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors items-center space-x-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
        )}
        
        {/* Friends List Modal */}
        {showFriendList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background/95 rounded-xl w-full max-w-md shadow-xl border border-white/10">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Friends</h2>
                <button
                  onClick={() => setShowFriendList(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {loadingFriends ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-white">{friend.name}</p>
                            <p className="text-sm text-white/60">@{friend.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMessage(friend)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                          title="Send message"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <Users className="w-20 h-20 text-white/10 absolute inset-0" />
                      <Heart className="w-8 h-8 text-primary absolute bottom-0 right-0 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Friends Yet</h3>
                    <p className="text-white/60 mb-6 max-w-xs mx-auto">
                      Start connecting with others to build your friend network!
                    </p>
                    <button
                      onClick={() => {
                        setShowFriendList(false);
                        const event = new CustomEvent('openMessages');
                        window.dispatchEvent(event);
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:opacity-90 transition-opacity inline-flex items-center space-x-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Find Friends</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Post key={post.id} post={post} user={profileUser || currentUser!} />
          ))}
        </div>
      </div>
    </div>
  );
}