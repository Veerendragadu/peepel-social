import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Users, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebaseClient';
import { signInWithEmailAndPassword } from 'firebase/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email || !password) return;
    
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      login({
        id: user.uid,
        email: user.email!,
        username: user.email!.split('@')[0],
        name: user.displayName || user.email!.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
        walletBalance: 0,
        isAdmin: false,
      });

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
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
          <h1 className="text-3xl font-bold text-white mt-4">Welcome Back</h1>
          <p className="text-white/60 mt-2">Sign in to continue to Peepel</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-sm text-primary hover:text-primary/90 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-white/60">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/90 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}