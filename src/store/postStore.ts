import { create } from 'zustand';
import type { Post, Comment } from '../types';

interface PostState {
  posts: Post[];
  comments: Record<string, Comment[]>;
  setPosts: (posts: Post[]) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  setComments: (postId: string, comments: Comment[]) => void;
  addComment: (postId: string, comment: Comment) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  comments: {},
  setPosts: (posts) => set({ posts }),
  likePost: (postId) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ),
  })),
  unlikePost: (postId) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId ? { ...post, likes: post.likes - 1 } : post
    ),
  })),
  setComments: (postId, comments) => set((state) => ({
    comments: { ...state.comments, [postId]: comments },
  })),
  addComment: (postId, comment) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: [...(state.comments[postId] || []), comment],
    },
    posts: state.posts.map((post) =>
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ),
  })),
}));