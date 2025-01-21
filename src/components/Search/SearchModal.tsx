import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Hash, Clock, X, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'tags'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Mock search results
  const searchResults = {
    people: [
      {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=32&h=32&q=80',
      },
      {
        id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32&q=80',
      },
    ],
    tags: [
      { id: '1', name: 'technology', posts: 1234 },
      { id: '2', name: 'programming', posts: 987 },
      { id: '3', name: 'webdev', posts: 756 },
    ],
    trending: [
      { id: '1', topic: 'AI and Machine Learning', posts: 5432 },
      { id: '2', topic: 'Web Development', posts: 4321 },
      { id: '3', topic: 'Mobile Apps', posts: 3210 },
    ],
  };

  if (!isOpen) return null;

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
      setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
    }
  };

  const clearRecentSearch = (searchQuery: string) => {
    setRecentSearches(prev => prev.filter(q => q !== searchQuery));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-20">
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-background/95 rounded-xl shadow-xl border border-white/10 max-h-[calc(100vh-6rem)] overflow-hidden"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for people, tags, or topics..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'people'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/60 hover:text-white'
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'tags'
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tags
          </button>
        </div>

        {/* Search Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
          {!query && (
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white/60">Recent Searches</h3>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <div
                        key={search}
                        className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-white/40" />
                          <span className="text-white">{search}</span>
                        </div>
                        <button
                          onClick={() => clearRecentSearch(search)}
                          className="text-white/40 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Trending</h3>
                <div className="space-y-2">
                  {searchResults.trending.map((trend) => (
                    <div
                      key={trend.id}
                      className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-white">{trend.topic}</span>
                      </div>
                      <span className="text-sm text-white/40">{trend.posts} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query && (
            <div className="p-4 space-y-6">
              {/* People Results */}
              {(activeTab === 'all' || activeTab === 'people') && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">People</h3>
                  <div className="space-y-2">
                    {searchResults.people.map((person) => (
                      <Link
                        key={person.id}
                        to={`/profile/${person.username}`}
                        className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg"
                      >
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-white font-medium">{person.name}</div>
                          <div className="text-sm text-white/60">@{person.username}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Results */}
              {(activeTab === 'all' || activeTab === 'tags') && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">Tags</h3>
                  <div className="space-y-2">
                    {searchResults.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-primary" />
                          <span className="text-white">#{tag.name}</span>
                        </div>
                        <span className="text-sm text-white/40">{tag.posts} posts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}