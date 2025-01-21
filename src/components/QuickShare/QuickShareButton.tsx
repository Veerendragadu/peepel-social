import React, { useState } from 'react';
import { Plus, Image, Link as LinkIcon, Smile } from 'lucide-react';

export function QuickShareButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Image, label: 'Photo' },
    { icon: LinkIcon, label: 'Link' },
    { icon: Smile, label: 'Status' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={`absolute bottom-full right-0 mb-4 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="flex flex-col-reverse items-end space-y-reverse space-y-2">
          {actions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center space-x-2 px-4 py-2 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <span className="text-white text-sm">{label}</span>
              <Icon className="w-4 h-4 text-primary" />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:opacity-90 transition-all transform ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}