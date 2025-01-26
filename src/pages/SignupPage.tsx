import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Heart, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebaseClient';
import { isUsernameAvailable } from '../services/userService';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  phoneNumber: string;
  countryCode: string;
}

interface CountryCode {
  code: string;
  name: string;
  dial_code: string;
}

export function SignupPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phoneNumber: '',
    countryCode: '+1' // Default to US
  });

  const [countryCodes] = useState<CountryCode[]>([
    { code: "US", name: "United States", dial_code: "+1" },
    { code: "GB", name: "United Kingdom", dial_code: "+44" },
    { code: "IN", name: "India", dial_code: "+91" },
    { code: "CA", name: "Canada", dial_code: "+1" },
    { code: "AU", name: "Australia", dial_code: "+61" },
    { code: "DE", name: "Germany", dial_code: "+49" },
    { code: "FR", name: "France", dial_code: "+33" },
    { code: "IT", name: "Italy", dial_code: "+39" },
    { code: "ES", name: "Spain", dial_code: "+34" },
    { code: "BR", name: "Brazil", dial_code: "+55" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleUsernameChange = async (username: string) => {
    setFormData(prev => ({ ...prev, username }));
    setError(null);
    setUsernameError(null);
    setUsernameAvailable(null);
    setCheckingUsername(false);

    const trimmedUsername = username.trim();
    console.log('Checking username:', trimmedUsername);

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(trimmedUsername);
      console.log('Username availability result:', available);
      console.log('Username availability result:', available);
      setUsernameAvailable(available);
      if (!available) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('An error occurred while checking username availability');
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const trimmedUsername = formData.username.trim();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }

    if (!usernameAvailable) {
      setError('Please choose a different username');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(),
        formData.email,
        formData.password
      );

      // Create user document in Firestore
      const userData = {
        email: formData.email,
        id: userCredential.user.uid,
        username: trimmedUsername.toLowerCase(),
        phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
        name: trimmedUsername,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${trimmedUsername}`,
        isAdmin: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
        searchTerms: generateSearchTerms(trimmedUsername)
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      await setDoc(doc(getFirestore(), 'users', userCredential.user.uid), userData);

      // Navigate to login with success message
      navigate('/login', {
        state: {
          message: 'Account created successfully! Please sign in to continue.'
        },
        replace: true
      });
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else {
        setError('Failed to create account. Please try again.');
      }
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
              {usernameError && (
                <p className="mt-1 text-sm text-red-500">{usernameError}</p>
              )}
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Phone Number
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-32 px-3 py-2 bg-background border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {countryCodes.map((country) => (
                    <option
                      key={country.code}
                      value={country.dial_code}
                      className="bg-background text-white"
                    >
                      {country.name} ({country.dial_code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phoneNumber: value });
                  }}
                  placeholder="Phone Number"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-white/60">
                Enter your 10-digit phone number without spaces or dashes
              </p>
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Password must contain:
              <span className="block ml-2">• At least 8 characters</span>
              <span className="block ml-2">• One uppercase letter</span>
              <span className="block ml-2">• One lowercase letter</span>
              <span className="block ml-2">• One number</span>
              <span className="block ml-2">• One special character (!@#$%^&*)</span>
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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