import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authAPI, User } from '../pages/Axios/Axios';
import authService from '../services/authService';
import { setTokenExpiredCallback } from '../services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set timer if user is logged in
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        toast.error('Phiên đăng nhập đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.');
        logout();
        window.location.href = '/login';
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, logout]);

  useEffect(() => {
    // Setup callback for token expiration from api interceptor
    setTokenExpiredCallback(() => {
      setUser(null);
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      // Redirect to login page
      window.location.href = '/login';
    });

    // Check if user is already logged in
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      // Check if token is still valid
      if (authService.isAuthenticated()) {
        setUser(currentUser);
      } else {
        // Token expired, clear user data
        authAPI.logout();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Setup inactivity timer and activity listeners
  useEffect(() => {
    if (!user) return;

    // Reset timer on mount
    resetInactivityTimer();

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timer on any activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, username: string, password: string) => {
    try {
      await authAPI.register({ name, email, username, password, role: 'customer' });
      // Don't set user or store token - user must verify email first
      // Just return success, the user will need to verify email before logging in
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
