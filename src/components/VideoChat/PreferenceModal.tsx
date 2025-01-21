import React from 'react';
import { X, Users, UserPlus, Globe, Lock } from 'lucide-react';

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: () => void;
  onMeetStranger: () => void;
  onJoinRoom: () => void;
}

export function PreferenceModal({ isOpen, onClose, onCreateRoom, onMeetStranger, onJoinRoom }: PreferenceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background/95 rounded-xl w-full max-w-sm shadow-xl border border-white/10 mt-16">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Choose Chat Type</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <button
            onClick={onMeetStranger}
            className="w-full flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-secondary" />
            </div>
            <div className="ml-3 flex-1 text-left">
              <h3 className="text-base font-semibold text-white">Meet Stranger</h3>
              <p className="text-xs text-white/60">Connect with random people</p>
            </div>
            <Globe className="w-4 h-4 text-white/40 ml-2" />
          </button>

          <button
            onClick={onCreateRoom}
            className="w-full flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="ml-3 flex-1 text-left">
              <h3 className="text-base font-semibold text-white">Create Room</h3>
              <p className="text-xs text-white/60">Create a private room</p>
            </div>
            <Lock className="w-4 h-4 text-white/40 ml-2" />
          </button>

          <button
            onClick={onJoinRoom}
            className="w-full flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-secondary" />
            </div>
            <div className="ml-3 flex-1 text-left">
              <h3 className="text-base font-semibold text-white">Join Room</h3>
              <p className="text-xs text-white/60">Join with a room code</p>
            </div>
            <Globe className="w-4 h-4 text-white/40 ml-2" />
          </button>

          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-xs font-medium text-white/80 mb-2">Safety Tips</h4>
            <ul className="text-xs text-white/60 space-y-1">
              <li>• Be respectful to other users</li>
              <li>• Don't share personal information</li>
              <li>• Report inappropriate behavior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}