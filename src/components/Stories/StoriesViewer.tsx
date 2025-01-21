import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  type: 'image' | 'video';
  duration: number;
  createdAt: string;
}

interface StoriesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStoryId?: string;
}

export function StoriesViewer({ isOpen, onClose, initialStoryId }: StoriesViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Mock stories data
  const stories: Story[] = [
    {
      id: '1',
      userId: '1',
      mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      type: 'image',
      duration: 5000,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: '1',
      mediaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
      type: 'image',
      duration: 5000,
      createdAt: new Date().toISOString(),
    },
  ];

  if (!isOpen) return null;

  const currentStory = stories[currentStoryIndex];

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full md:w-[400px] md:h-[700px]">
        {/* Story Content */}
        <img
          src={currentStory.mediaUrl}
          alt="Story"
          className="w-full h-full object-cover"
        />

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
          {stories.map((story, index) => (
            <div
              key={story.id}
              className="h-0.5 flex-1 bg-white/30 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${
                  index === currentStoryIndex && !isPaused ? 'w-full' : 
                  index < currentStoryIndex ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 flex items-center px-4">
          <div className="flex items-center">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full border-2 border-primary"
            />
            <span className="ml-2 text-white font-medium">{user?.username}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <button
          onClick={handlePrevious}
          className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white ${
            currentStoryIndex === 0 ? 'hidden' : ''
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white"
        >
          {isPaused ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}