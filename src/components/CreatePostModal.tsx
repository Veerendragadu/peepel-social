import React, { useState, useRef } from 'react';
import { X, Image, Smile, MapPin, Hash, Clock, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState([{ text: '' }, { text: '' }]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const addPost = usePostStore((state) => state.addPost);

  // Mock data for suggestions
  const locationSuggestions = ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'];
  const hashtagSuggestions = ['technology', 'programming', 'webdev', 'coding', 'javascript'];

  if (!isOpen || !user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      alert('You can only upload up to 4 images');
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
    }
    setHashtagInput('');
    setShowHashtagSuggestions(false);
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0 && !isPoll) return;

    const newPost = {
      id: crypto.randomUUID(),
      userId: user.id,
      content: content.trim(),
      likes: 0,
      comments: 0,
      createdAt: scheduleDate?.toISOString() || new Date().toISOString(),
      images: images,
      location,
      hashtags,
      isPoll,
      pollOptions: isPoll ? pollOptions : undefined,
    };

    addPost(newPost);
    setContent('');
    setImages([]);
    setLocation(null);
    setHashtags([]);
    setScheduleDate(null);
    setIsPoll(false);
    setPollOptions([{ text: '' }, { text: '' }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background/95 rounded-xl w-full max-w-2xl shadow-xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start space-x-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent border-none focus:ring-0 resize-none h-32 text-white placeholder-white/50"
                autoFocus
              />
              
              {images.length > 0 && (
                <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isPoll && (
                <div className="mt-4 space-y-2">
                  {pollOptions.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index].text = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-white/40"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={() => setPollOptions([...pollOptions, { text: '' }])}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      + Add another option
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4 relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`text-white/60 hover:text-primary transition-colors ${
                  images.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={images.length >= 4}
              >
                <Image className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowLocationPicker(false);
                    setShowHashtagSuggestions(false);
                    setShowSchedulePicker(false);
                  }}
                  className="text-white/60 hover:text-primary transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="fixed bottom-20 left-4 p-4 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="grid grid-cols-8 gap-2">
                      {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💡', '✨'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setContent(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-2xl hover:bg-white/10 p-2 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLocationPicker(!showLocationPicker);
                    setShowEmojiPicker(false);
                    setShowHashtagSuggestions(false);
                    setShowSchedulePicker(false);
                  }}
                  className={`text-white/60 hover:text-primary transition-colors ${
                    location ? 'text-primary' : ''
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </button>
                {showLocationPicker && (
                  <div className="fixed bottom-20 left-4 w-64 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {locationSuggestions.map(loc => (
                        <button
                          key={loc}
                          onClick={() => {
                            setLocation(loc);
                            setShowLocationPicker(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded transition-colors text-white"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowHashtagSuggestions(!showHashtagSuggestions);
                    setShowEmojiPicker(false);
                    setShowLocationPicker(false);
                    setShowSchedulePicker(false);
                  }}
                  className={`text-white/60 hover:text-primary transition-colors ${
                    hashtags.length > 0 ? 'text-primary' : ''
                  }`}
                >
                  <Hash className="w-5 h-5" />
                </button>
                {showHashtagSuggestions && (
                  <div className="fixed bottom-20 left-4 w-64 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        placeholder="Enter hashtag..."
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-white/40 mb-2"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {hashtagSuggestions
                          .filter(tag => 
                            tag.toLowerCase().includes(hashtagInput.toLowerCase())
                          )
                          .map(tag => (
                            <button
                              key={tag}
                              onClick={() => addHashtag(tag)}
                              className="w-full text-left px-3 py-2 hover:bg-white/10 rounded transition-colors text-white"
                            >
                              #{tag}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSchedulePicker(!showSchedulePicker);
                    setShowEmojiPicker(false);
                    setShowLocationPicker(false);
                    setShowHashtagSuggestions(false);
                  }}
                  className={`text-white/60 hover:text-primary transition-colors ${
                    scheduleDate ? 'text-primary' : ''
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </button>
                {showSchedulePicker && (
                  <div className="fixed bottom-20 left-4 p-4 bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
                    <input
                      type="datetime-local"
                      value={scheduleDate?.toISOString().slice(0, 16) || ''}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        if (date > new Date()) {
                          setScheduleDate(date);
                        }
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsPoll(!isPoll)}
                className={`text-white/60 hover:text-primary transition-colors ${
                  isPoll ? 'text-primary' : ''
                }`}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {(content.trim() || images.length > 0 || isPoll) && (
                <span className="text-sm text-white/60">
                  {images.length}/4 images
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={(!content.trim() && images.length === 0 && !isPoll) || 
                         (isPoll && pollOptions.some(option => !option.text.trim()))}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduleDate ? 'Schedule' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}