'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from '@/lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  authPromptReason: string | null;
  openAuthModal: (tab?: 'signin' | 'signup', reason?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, targetExam?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (fallbackProfile?: { email: string; name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requireAuth: (actionDescription: string, callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          // Check if first-time visitor to show welcoming sign-in popup
          const hasSeenWelcome = sessionStorage.getItem('examforge_welcome_shown');
          if (!hasSeenWelcome) {
            sessionStorage.setItem('examforge_welcome_shown', 'true');
            setAuthModalTab('signin');
            setAuthPromptReason('Sign in with Google or create an account to unlock all features!');
            setIsAuthModalOpen(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin', reason?: string) => {
    setAuthModalTab(tab);
    setAuthPromptReason(reason || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptReason(null);
  };

  const login = async (email: string, password: string) => {
    try {
      let fbSuccess = false;
      let fbDisplayName = '';

      // If Firebase is configured, authenticate via Firebase
      if (typeof window !== 'undefined' && isFirebaseConfigured && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (cred.user) {
            fbSuccess = true;
            fbDisplayName = cred.user.displayName || '';
          }
        } catch (fbErr: any) {
          console.warn('Firebase signIn notice:', fbErr.code, fbErr.message);
          if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
            return { success: false, error: 'Incorrect email or password.' };
          }
          if (fbErr.code === 'auth/user-disabled') {
            return { success: false, error: 'This account has been disabled in Firebase.' };
          }
        }
      }

      // Attempt server login
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          closeAuthModal();
          return { success: true };
        }
      } catch (err) {
        console.warn('Direct server login error:', err);
      }

      // Fallback 1: If Firebase verified this email & password
      if (fbSuccess) {
        const sessionRes = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            name: fbDisplayName || email.split('@')[0],
          }),
        });
        const sessionData = await sessionRes.json();
        if (sessionRes.ok && sessionData.success && sessionData.user) {
          setUser(sessionData.user);
          closeAuthModal();
          return { success: true };
        }
      }

      // Fallback 2: Check local client registry (ensures persistence when serverless DB is unreachable)
      if (typeof window !== 'undefined') {
        try {
          const localUsers = JSON.parse(localStorage.getItem('examforge_registered_users') || '{}');
          const matched = localUsers[email.toLowerCase().trim()];
          if (matched && matched.password === password) {
            const sessionRes = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: matched.email,
                name: matched.name,
              }),
            });
            const sessionData = await sessionRes.json();
            if (sessionRes.ok && sessionData.success && sessionData.user) {
              setUser(sessionData.user);
              closeAuthModal();
              return { success: true };
            }
          }
        } catch (e) {}
      }

      return { success: false, error: 'Invalid email or password. Please try again.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string, targetExam?: string) => {
    try {
      // 1. If Firebase is configured, register user in Firebase Authentication!
      if (typeof window !== 'undefined' && isFirebaseConfigured && auth) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (userCred.user && name.trim()) {
            await updateProfile(userCred.user, { displayName: name.trim() });
          }
        } catch (fbErr: any) {
          console.warn('Firebase registration notice:', fbErr.code, fbErr.message);
          if (fbErr.code === 'auth/email-already-in-use') {
            return {
              success: false,
              error: 'An account with this email already exists in Firebase. Please sign in instead.',
            };
          }
          if (fbErr.code === 'auth/weak-password') {
            return {
              success: false,
              error: 'Password should be at least 6 characters long.',
            };
          }
          if (fbErr.code === 'auth/invalid-email') {
            return {
              success: false,
              error: 'Please enter a valid email address.',
            };
          }
        }
      }

      // Save user to client registry for resilient recovery across serverless cold starts
      if (typeof window !== 'undefined') {
        try {
          const localUsers = JSON.parse(localStorage.getItem('examforge_registered_users') || '{}');
          localUsers[email.toLowerCase().trim()] = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            targetExam: targetExam || 'Job Preparation',
            role: email.toLowerCase().trim() === 'admin@examforge.com' ? 'admin' : 'user',
          };
          localStorage.setItem('examforge_registered_users', JSON.stringify(localUsers));
        } catch (e) {}
      }

      // 2. Save user to server session & database (MongoDB/memoryStore)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, targetExam }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed' };
    }
  };

  const loginWithGoogle = async (fallbackProfile?: { email: string; name?: string; avatar?: string }) => {
    try {
      let googleProfile = fallbackProfile;

      // Try Firebase Google Auth popup if configured
      if (!googleProfile && typeof window !== 'undefined' && isFirebaseConfigured && auth && googleProvider) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const fbUser = result.user;
          if (fbUser && fbUser.email) {
            googleProfile = {
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              avatar: fbUser.photoURL || undefined,
            };
          }
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            return { success: false, error: 'Google sign-in popup was closed.' };
          }
          console.warn('Firebase popup issue, proceeding with direct profile handler:', popupErr.message);
        }
      }

      if (!googleProfile || !googleProfile.email) {
        return { success: false, error: 'Google authentication was not completed.' };
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: data.error || 'Google sign-in failed.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Google sign-in failed.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (e) {
      setUser(null);
    }
  };

  // Guard helper: if not authenticated, trigger auth modal with custom reason
  const requireAuth = (actionDescription: string, callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthModal('signin', `Please sign in with Google or your account to ${actionDescription}.`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalTab,
        authPromptReason,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
