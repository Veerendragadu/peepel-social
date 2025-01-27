import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthGuard } from './components/AuthGuard';
import { LoadingScreen } from './components/LoadingScreen';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebaseClient';

// Lazy load pages
// Import pages directly to avoid lazy loading issues
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Wait for login to complete before setting loading to false
            login({
              id: user.uid,
              email: userData.email,
              username: userData.username,
              name: userData.name,
              avatar: userData.avatar,
              walletBalance: userData.walletBalance || 0,
              isAdmin: userData.isAdmin || false,
              following: userData.following || 0,
              followers: userData.followers || 0,
              bio: userData.bio || '',
              phoneNumber: userData.phoneNumber || '',
              createdAt: userData.createdAt || '',
              updatedAt: userData.updatedAt || '',
              isBanned: userData.isBanned || false
            });
            setIsLoading(false);
          } else {
            console.error('User document does not exist');
            logout();
            setIsLoading(false);
          }
        } catch (error) {
          if (error.code !== 'failed-precondition') {
            console.error('Error fetching user data:', error);
          }
          logout();
          setIsLoading(false);
        }
      } else {
        logout();
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} 
        />
        <Route 
          path="/reset-password" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />} 
        />
        <Route 
          path="/" 
          element={<AuthGuard><HomePage /></AuthGuard>} 
        />
        <Route 
          path="/admin" 
          element={<AuthGuard><AdminDashboard /></AuthGuard>} 
        />
        <Route 
          path="/profile/:username" 
          element={<AuthGuard><ProfilePage /></AuthGuard>} 
        />
        <Route 
          path="*" 
          element={<NotFoundPage />} 
        />
      </Routes>
    </div>
  );
}