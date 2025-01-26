import { create } from 'zustand';
import { auth } from '../lib/firebaseClient';
import { signOut } from 'firebase/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateWalletBalance: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  updateWalletBalance: (amount) => 
    set((state) => ({
      user: state.user ? { ...state.user, walletBalance: amount } : null,
    })),
}));