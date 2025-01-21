import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Post } from '../components/Post';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { PreferenceModal } from '../components/VideoChat/PreferenceModal';
import { CreateRoomModal } from '../components/VideoChat/CreateRoomModal';
import { JoinRoomModal } from '../components/VideoChat/JoinRoomModal';
import { VideoModal } from '../components/VideoChat/VideoModal';
import { MessagesModal } from '../components/Messages/MessagesModal';
import { Users, UserPlus, Globe, Lock, Heart } from 'lucide-react';
import { GoogleAds } from '../components/Ads/GoogleAds';

export function HomePage() {
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);
  const [isMeetingStranger, setIsMeetingStranger] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  
  const posts = usePostStore((state) => state.posts);
  const user = useAuthStore((state) => state.user);

  const handleCreateRoom = () => {
    setIsPreferenceModalOpen(false);
    setIsCreateRoomModalOpen(true);
  };

  const handleJoinRoom = () => {
    setIsPreferenceModalOpen(false);
    setIsJoinRoomModalOpen(true);
  };

  const handleMeetStranger = () => {
    setIsPreferenceModalOpen(false);
    setIsMeetingStranger(true);
    setIsVideoChatOpen(true);
  };

  const handleRoomCreated = (roomName: string, roomCode: string, maxParticipants: number, privacy: 'public' | 'private') => {
    setIsCreateRoomModalOpen(false);
    setCurrentRoomCode(roomCode);
    setIsMeetingStranger(false);
    setIsVideoChatOpen(true);
  };

  const handleJoinExistingRoom = (roomCode: string) => {
    setIsJoinRoomModalOpen(false);
    setCurrentRoomCode(roomCode);
    setIsMeetingStranger(false);
    setIsVideoChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        onStartVideoChat={() => setIsPreferenceModalOpen(true)}
        onOpenMessages={() => setIsMessagesModalOpen(true)}
      />
      
      {/* Only show main content when messages modal is closed */}
      {!isMessagesModalOpen && (
        <main className="px-4 pt-24 pb-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-8">
                {/* Welcome Section - Always visible */}
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center group">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 animate-pulse">
                        <Heart className="w-10 h-10 text-primary transform group-hover:scale-110 transition-transform" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-white mt-4 mb-2">Welcome to Peepel</h1>
                  <p className="text-white/60">Connect with people around the world</p>
                </div>

                {/* Video Chat Options */}
                <div className="space-y-6 mb-12">
                  {/* Meet Stranger */}
                  <button
                    onClick={handleMeetStranger}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 border border-white/10 p-8 transition-all hover:shadow-lg hover:border-white/20"
                  >
                    <div className="relative z-10">
                      <div className="mb-6">
                        <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                          <UserPlus className="w-8 h-8 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Meet Stranger</h3>
                        <p className="text-white/60">Connect with random people around the world through video chat.</p>
                      </div>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Google Ad Banner */}
                  <GoogleAds className="h-24" />

                  {/* Create Chat Room */}
                  <button
                    onClick={handleCreateRoom}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 p-8 transition-all hover:shadow-lg hover:border-white/20"
                  >
                    <div className="relative z-10">
                      <div className="mb-6">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Create Chat Room</h3>
                        <p className="text-white/60">Create a private room and invite friends to join your video chat.</p>
                      </div>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white/60" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {posts.map(post => (
                    <Post
                      key={post.id}
                      post={post}
                      user={user!}
                    />
                  ))}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  {/* Additional content can go here */}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modals */}
      <PreferenceModal
        isOpen={isPreferenceModalOpen}
        onClose={() => setIsPreferenceModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        onMeetStranger={handleMeetStranger}
        onJoinRoom={handleJoinRoom}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={isJoinRoomModalOpen}
        onClose={() => setIsJoinRoomModalOpen(false)}
        onJoinRoom={handleJoinExistingRoom}
      />

      <VideoModal
        isOpen={isVideoChatOpen}
        onClose={() => {
          setIsVideoChatOpen(false);
          setCurrentRoomCode(null);
        }}
        isMeetingStranger={isMeetingStranger}
      />

      <MessagesModal
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
      />
    </div>
  );
}