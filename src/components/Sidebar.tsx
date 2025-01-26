import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Video, MessageSquare, Heart, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationModal } from './Notifications/NotificationModal';

interface SidebarProps {
  onStartVideoChat: () => void;
}

export function Sidebar({ onStartVideoChat }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [showHeart, setShowHeart] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowHeart(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const quickActions = [
    {
      icon: Video,
      label: 'Video Chat',
      onClick: onStartVideoChat,
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      onClick: () => {},
    },
    {
      icon: Bell,
      label: 'Notifications',
      onClick: () => setIsNotificationModalOpen(true),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-[51] p-3 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/10 transition-colors group md:block hidden"
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[48] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 md:top-24 bottom-0 left-0 z-[49] transform transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-[280px]'
        } md:translate-x-0 bg-background/95 backdrop-blur-sm border-r border-white/10 flex flex-col overflow-y-auto scrollbar-hide`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 px-4 md:px-0 py-4">
          <div className="flex items-center px-2 md:px-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-100' : 'opacity-0'}`}>
                <Heart className="w-6 h-6 text-primary transform group-hover:scale-110 transition-transform" fill="currentColor" />
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-0' : 'opacity-100'}`}>
                <Users className="w-6 h-6 text-primary transform group-hover:scale-110 transition-transform" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex items-baseline">
                <span className="font-sofia text-2xl font-bold text-primary group-hover:text-primary/90 transition-colors">P</span>
                <span className="text-xl font-bold text-secondary group-hover:text-secondary/90 transition-colors">eepel</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 md:px-0 py-2 border-b border-white/10">
          <div className={`flex ${isCollapsed ? 'flex-col space-y-2' : 'justify-between'} px-2`}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="relative p-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors group"
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {action.label}
                    </span>
                  )}
                  {action.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs flex items-center justify-center rounded-full">
                      {action.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Link */}
        <div className="flex-1 px-4 md:px-0 py-2">
          <Link
            to={`/profile/${user?.username}`}
            className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
              isActive(`/profile/${user?.username}`)
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            {!isCollapsed && <span>Profile</span>}
          </Link>
        </div>
      </aside>

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  );
}