import React from 'react';
import { TrendingUp, Hash } from 'lucide-react';

export function TrendingTopics() {
  // Mock trending topics
  const trends = [
    { id: 1, tag: 'Technology', posts: 1234 },
    { id: 2, tag: 'Programming', posts: 987 },
    { id: 3, tag: 'WebDev', posts: 856 },
    { id: 4, tag: 'AI', posts: 754 },
    { id: 5, tag: 'React', posts: 632 },
  ];

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-white">Trending Topics</h2>
      </div>
      
      <div className="space-y-3">
        {trends.map((trend) => (
          <button
            key={trend.id}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <span className="text-white group-hover:text-primary transition-colors">
                {trend.tag}
              </span>
            </div>
            <span className="text-sm text-white/60">
              {trend.posts.toLocaleString()} posts
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}