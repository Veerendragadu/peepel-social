import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { Post } from '../components/Post';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const posts = usePostStore((state) => 
    state.posts.filter((post) => post.userId === user?.id)
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-24">
      <button
        onClick={() => navigate('/')}
        className="fixed top-20 left-4 md:left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/10 transition-colors group"
      >
        <Home className="w-5 h-5 text-white/70 group-hover:text-white" />
      </button>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
          <div className="flex items-center">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-white/60">@{user.username}</p>
              <p className="mt-2 text-white/80">{user.bio}</p>
              <div className="mt-4 flex space-x-6">
                <div>
                  <span className="font-bold text-white">{user.following}</span>
                  <span className="ml-1 text-white/60">Following</span>
                </div>
                <div>
                  <span className="font-bold text-white">{user.followers}</span>
                  <span className="ml-1 text-white/60">Followers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Post key={post.id} post={post} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}