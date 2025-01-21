import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthGuard } from './components/AuthGuard';
import { LoadingScreen } from './components/LoadingScreen';
import { auth } from './lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { login, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          login({
            id: user.uid,
            email: user.email!,
            username: user.email!.split('@')[0],
            name: user.displayName || user.email!.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
            walletBalance: 0,
            isAdmin: false,
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}