'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearAccessToken, me } from '../lib/api-client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  userId: string | null;
  setAuthenticated: (userId: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Owns the client-side session status. On mount, attempts a silent
 * `GET /auth/me` — since the access token lives in-memory only, this is
 * also what restores a session after a full page reload (the api-client's
 * request wrapper transparently retries via the httpOnly refresh cookie on
 * the resulting 401).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    me()
      .then((result) => {
        if (!cancelled) {
          setUserId(result.id);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthenticated = useCallback((id: string) => {
    setUserId(id);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    clearAccessToken();
    setUserId(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, userId, setAuthenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
