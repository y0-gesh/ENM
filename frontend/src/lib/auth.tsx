'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch, setAccessToken } from './api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Try to restore session on page mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await apiFetch('/auth/refresh', { method: 'POST' });
        if (response.success && response.data?.accessToken) {
          setAccessToken(response.data.accessToken);
          
          // Let's decode or fetch user details. Wait, the login response contains user details,
          // but for refresh we only get accessToken. Let's create a small helper or endpoint,
          // or parse the user info from the JWT payload itself!
          // JWT token contains: { userId, email, role }
          // We can write a tiny JWT decoder in client side JavaScript without external packages!
          const token = response.data.accessToken;
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payloadBase64));
          
          setUser({
            id: decodedPayload.userId,
            email: decodedPayload.email,
            role: decodedPayload.role,
            name: decodedPayload.name || 'User' // Default name, or we can fetch a profile
          });
        }
      } catch (error) {
        // Safe to ignore, session just doesn't exist
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    // Listen to global logout events from API client
    const handleLogoutEvent = () => {
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success && response.data) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        router.push('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData: any) => {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success && response.data) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        router.push('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[Auth] Logout API call failed:', error);
    } finally {
      setAccessToken('');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
