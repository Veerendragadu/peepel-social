import React, { useState, useEffect } from 'react';
import { X, Users, Globe, Lock, Copy, Check } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomName: string, roomCode: string, maxParticipants: number, privacy: 'public' | 'private') => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  const generateRoomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    return code;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      const code = roomCode || generateRoomCode();
      onCreateRoom(roomName.trim(), code, maxParticipants, privacy);
    }
  };

  const copyRoomCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (isOpen && !roomCode) {
      generateRoomCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background/95 rounded-xl w-full max-w-sm shadow-xl border border-white/10 mt-16">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Create Chat Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-white/80 mb-2">
              Room Name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Enter room name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Room Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm">
                {roomCode}
              </div>
              <button
                type="button"
                onClick={copyRoomCode}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                title={copied ? "Copied!" : "Copy room code"}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Maximum Participants
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxParticipants(num)}
                  className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                    maxParticipants === num
                      ? 'bg-primary/20 border-primary'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-white text-sm">{num}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Privacy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition-colors ${
                  privacy === 'public'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Globe className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition-colors ${
                  privacy === 'private'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Lock className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Private</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
}