import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Video, MessageSquare, Heart, Users, Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationModal } from './Notifications/NotificationModal';

interface NavbarProps {
  onStartVideoChat: () => void;
  onOpenMessages: () => void;
}

export function Navbar({ onStartVideoChat, onOpenMessages }: NavbarProps) {
  const [showHeart, setShowHeart] = useState(true);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowHeart(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/', { replace: true });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/', { replace: true });
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center cursor-pointer z-50 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center group">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-100' : 'opacity-0'}`}>
                    <Heart className="w-5 h-5 text-primary transform group-hover:scale-110 transition-transform" fill="currentColor" />
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-0' : 'opacity-100'}`}>
                    <Users className="w-5 h-5 text-primary transform group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="ml-2 flex items-baseline">
                  <span className="font-sofia text-xl font-bold text-primary group-hover:text-primary/90 transition-colors">P</span>
                  <span className="text-lg font-bold text-secondary group-hover:text-secondary/90 transition-colors">eepel</span>
                </div>
              </div>
            </button>

            {/* Navigation Items */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleHomeClick}
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title="Home"
              >
                <Home className="w-5 h-5" />
              </button>

              <button
                onClick={onStartVideoChat}
                className="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                title="Video Chat"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenMessages}
                className="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-white/10" />

              <Link
                to={`/profile/${user?.username}`}
                className={`p-2 rounded-lg transition-colors ${
                  isActive(`/profile/${user?.username}`)
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title="Profile"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  );
}