import React, { useState, useRef } from 'react';
import { Image, Smile, MapPin, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = useAuthStore((state) => state.user);
  const addPost = usePostStore((state) => state.addPost);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length + mediaFiles.length > 4) {
      alert('Maximum 4 media files allowed');
      return;
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setMediaPreviewUrls(prev => [...prev, url]);
    });
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviewUrls[index]); // Clean up preview URL
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && mediaFiles.length === 0) || loading || !user) return;

    setLoading(true);
    try {
      // Create post with local data
      const mediaUrls = mediaFiles.map((file, index) => ({
        url: mediaPreviewUrls[index],
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }));

      const newPost = {
        id: crypto.randomUUID(),
        userId: user.id,
        content: content.trim(),
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        media: mediaUrls
      };

      // Add post to local state
      addPost(newPost);

      // Clean up preview URLs
      mediaPreviewUrls.forEach(url => URL.revokeObjectURL(url));

      // Clear the form
      setContent('');
      setMediaFiles([]);
      setMediaPreviewUrls([]);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-4">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none focus:ring-0 resize-none h-20 text-white placeholder-white/50"
          />
          
          {mediaPreviewUrls.length > 0 && (
            <div className={`grid gap-2 mb-4 ${
              mediaPreviewUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {mediaPreviewUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  {mediaFiles[index].type.startsWith('image/') ? (
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={url}
                      className="w-full h-full object-cover rounded-lg"
                      controls
                    />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`text-white/60 hover:text-primary transition-colors ${
                  mediaFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={mediaFiles.length >= 4}
              >
                <Image className="w-5 h-5" />
              </button>
              <button className="text-white/60 hover:text-primary transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <button className="text-white/60 hover:text-primary transition-colors">
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && mediaFiles.length === 0) || loading}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}