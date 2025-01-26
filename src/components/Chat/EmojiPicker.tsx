import React, { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
  'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
  'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏'],
  'Objects': ['💼', '📚', '📱', '💻', '⌚️', '🎮', '🎲', '🎨', '📷', '🔋', '💡', '🔑', '🔒', '📝', '✏️'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Only close if clicked outside the picker
        const customEvent = new CustomEvent('closePicker');
        document.dispatchEvent(customEvent);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl w-[280px] sm:w-[320px] max-h-[400px] flex flex-col overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from bubbling
      onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
    >
      {/* Category Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide p-2 border-b border-white/10 bg-white/5">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from bubbling
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === category
                ? 'bg-primary/20 text-primary'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from bubbling
              className="aspect-square flex items-center justify-center p-1.5 hover:bg-white/10 rounded-lg transition-colors text-xl sm:text-2xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Recently Used - Placeholder */}
      <div className="p-2 border-t border-white/10 bg-white/5">
        <p className="text-xs text-white/40 text-center">Recently Used</p>
      </div>
    </div>
  );
}