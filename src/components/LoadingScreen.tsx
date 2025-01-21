import React, { useState, useEffect } from 'react';
import { Heart, Users } from 'lucide-react';

export function LoadingScreen() {
  const [showHeart, setShowHeart] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowHeart(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center animate-fadeOut">
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-100' : 'opacity-0'}`}>
            <Heart className="w-12 h-12 text-primary transform group-hover:scale-110 transition-transform" fill="currentColor" />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showHeart ? 'opacity-0' : 'opacity-100'}`}>
            <Users className="w-12 h-12 text-primary transform group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline">
          <span className="font-sofia text-2xl font-bold text-primary">P</span>
          <span className="text-xl font-bold text-secondary">eepel</span>
        </div>
      </div>
    </div>
  );
}