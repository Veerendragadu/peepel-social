import React, { useState } from 'react';
import { Search, TrendingUp, Users, Image as ImageIcon } from 'lucide-react';
import { TrendingTopics } from '../components/TrendingTopics/TrendingTopics';

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock explore content
  const exploreContent = [
    {
      id: 1,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4',
      title: 'Tech Innovation',
    },
    {
      id: 2,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      title: 'Modern Workspace',
    },
    {
      id: 3,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd',
      title: 'Creative Code',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, people, or content..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 pl-10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>

            {/* Explore Grid */}
            <div className="grid grid-cols-2 gap-4">
              {exploreContent.map((item) => (
                <div
                  key={item.id}
                  className="relative group overflow-hidden rounded-xl aspect-square"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrendingTopics />
          </div>
        </div>
      </div>
    </div>
  );
}