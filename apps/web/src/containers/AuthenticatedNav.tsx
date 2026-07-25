'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../components/atoms/Button';
import { useAuth } from './auth-context';

/** Shared chrome for every authenticated screen: primary nav + log out. */
export function AuthenticatedNav() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleLogout(): Promise<void> {
    await signOut();
    router.push('/login');
  }

  return (
    <nav aria-label="Main">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/accounts">Accounts</Link>
      <Link href="/categories">Categories</Link>
      <Link href="/transactions">Transactions</Link>
      <Link href="/budgets">Budgets</Link>
      <Button type="button" onClick={() => void handleLogout()}>
        Log out
      </Button>
    </nav>
  );
}
