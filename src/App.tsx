import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthGuard } from './components/AuthGuard';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingScreen } from './components/LoadingScreen';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebaseClient';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
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
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [login, logout, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />
        } />
        <Route path="/reset-password" element={
          isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />
        } />
        <Route path="/" element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        } />
        <Route path="/admin" element={
          <AuthGuard>
            <AdminDashboard />
          </AuthGuard>
        } />
        <Route path="/profile/:username" element={
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}