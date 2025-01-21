import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Users, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebaseClient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { isUsernameAvailable } from '../services/userService';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export function SignupPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const generateSearchTerms = (username: string): string[] => {
    const terms = new Set<string>();
    const lowerUsername = username.toLowerCase();
    
    // Add full username
    terms.add(lowerUsername);
    
    // Add each prefix
    for (let i = 1; i <= lowerUsername.length; i++) {
      terms.add(lowerUsername.slice(0, i));
    }
    
    // Add each word if username contains spaces
    if (lowerUsername.includes(' ')) {
      lowerUsername.split(' ').forEach(word => {
        if (word) terms.add(word);
      });
    }
    
    return Array.from(terms);
  };

  const handleUsernameChange = async (username: string) => {
    setFormData(prev => ({ ...prev, username }));
    setError(null);
    setUsernameAvailable(null);

    // Don't check if username is empty or too short
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    // Check for valid characters first
    if (!/^[a-z0-9_]+$/i.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username);
      setUsernameAvailable(available);
      if (!available) {
        setError('Username is already taken');
      }
    } catch (err) {
      // Don't show error for availability check failures
      console.error('Error checking username:', err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.username) {
      setError('Username is required');
      return;
    }

    if (!usernameAvailable) {
      setError('Please choose a different username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;
      const username = formData.username.toLowerCase();

      // Generate search terms for the username
      const searchTerms = generateSearchTerms(username);

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        email: formData.email,
        username,
        name: formData.username,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        searchTerms,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAdmin: false,
        isBanned: false,
        following: 0,
        followers: 0,
        bio: '',
        walletBalance: 0
      });

      await updateProfile(userCredential.user, {
        displayName: formData.username,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`
      });

      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Email might be already in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center group">
            <div className="relative w-16 h-16">
              <Heart className="w-16 h-16 text-primary transform group-hover:scale-110 transition-transform" fill="currentColor" />
              <Users className="absolute inset-0 w-16 h-16 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">Create Account</h1>
          <p className="text-white/60 mt-2">Join Peepel today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary ${
                  usernameAvailable === true
                    ? 'border-green-500'
                    : usernameAvailable === false
                    ? 'border-red-500'
                    : 'border-white/10'
                }`}
                placeholder="Choose a username"
                required
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password || !formData.username || !usernameAvailable}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/90 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}