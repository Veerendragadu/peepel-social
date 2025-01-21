import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Post as PostType, User, Comment } from '../types';
import { usePostStore } from '../store/postStore';
import { Link } from 'react-router-dom';

interface PostProps {
  post: PostType;
  user: User;
}

export function Post({ post, user }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const { likePost, unlikePost, addComment } = usePostStore();
  const [lastLikeClick, setLastLikeClick] = useState<number>(0);

  const handleLike = () => {
    const now = Date.now();
    if (now - lastLikeClick < 300) {
      if (liked) {
        unlikePost(post.id);
        setLiked(false);
      } else {
        likePost(post.id);
        setLiked(true);
      }
    }
    setLastLikeClick(now);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      postId: post.id,
      userId: user.id,
      content: comment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0
    };

    addComment(post.id, newComment);
    setComment('');
  };

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4">
      <div className="flex items-center mb-4">
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
          />
        </Link>
        <div className="ml-3">
          <Link to={`/profile/${user.username}`}>
            <h3 className="font-semibold text-white hover:text-primary transition-colors">
              {user.name}
            </h3>
          </Link>
          <div className="flex items-center text-sm text-white/60">
            <span>@{user.username}</span>
            <span className="mx-1">·</span>
            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
          </div>
        </div>
      </div>
      
      <p className="text-white/90 mb-4 whitespace-pre-wrap">{post.content}</p>
      
      {post.media && post.media.length > 0 && (
        <div className={`mb-4 grid gap-2 ${
          post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
        }`}>
          {post.media.map((media, index) => (
            <div 
              key={index} 
              className="relative group aspect-square"
              onDoubleClick={handleLike}
            >
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={`Post media ${index + 1}`}
                  className="rounded-lg w-full h-full object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  className="rounded-lg w-full h-full object-cover"
                  controls
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-white/60">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${
            liked ? 'text-primary' : 'hover:text-primary'
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:text-secondary transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-primary/80 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <form onSubmit={handleSubmitComment} className="flex items-start space-x-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!comment.trim()}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 space-y-4">
            {post.comments > 0 ? (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{user.name}</span>
                      <span className="text-sm text-white/60">Just now</span>
                    </div>
                    <p className="text-white/80 mt-1">Great post! 👍</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-white/60 py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}