import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, UserPlus, Bell, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Notification } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      userId: '2',
      postId: '1',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      user: {
        id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32&q=80',
      }
    },
    {
      id: '2',
      type: 'comment',
      userId: '3',
      postId: '2',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      user: {
        id: '3',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=32&h=32&q=80',
      }
    },
    {
      id: '3',
      type: 'follow',
      userId: '4',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      user: {
        id: '4',
        name: 'Alice Johnson',
        username: 'alicej',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=32&h=32&q=80',
      }
    }
  ];

  // Handle history state for back button
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'notifications' }, '');
    }

    const handlePopState = () => {
      if (window.history.state?.modal === 'notifications') {
        // Prevent default back behavior
        window.history.pushState({ modal: 'notifications' }, '');
      } else {
        // Close modal if we're going back from the initial state
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your profile';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-20">
      <div className="w-full max-w-md bg-background/95 rounded-xl shadow-xl border border-white/10 max-h-[calc(100vh-6rem)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors ${
                    !notification.read ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Link to={`/profile/${notification.user.username}`}>
                      <img
                        src={notification.user.avatar}
                        alt={notification.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/profile/${notification.user.username}`}
                          className="font-medium text-white hover:text-primary transition-colors"
                        >
                          {notification.user.name}
                        </Link>
                        <span className="text-white/60">{getNotificationText(notification)}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {getNotificationIcon(notification.type)}
                        <span className="text-sm text-white/40">
                          {formatDistanceToNow(new Date(notification.createdAt))} ago
                        </span>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                <Bell className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-white/60">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}