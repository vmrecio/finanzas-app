'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-context';

export interface RequireAuthProps {
  children: ReactNode;
}

/** Route guard: redirects to `/login` once session status resolves to unauthenticated. */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
