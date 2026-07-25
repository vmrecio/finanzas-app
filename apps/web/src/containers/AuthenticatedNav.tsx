'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '../components/atoms/Button';
import { useAuth } from './auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/accounts', label: 'Accounts', icon: 'account_balance' },
  { href: '/categories', label: 'Categories', icon: 'category' },
  { href: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { href: '/budgets', label: 'Budgets', icon: 'savings' },
];

/** A Material Symbol glyph. `aria-hidden` so its ligature text never leaks into an ancestor link/button's accessible name. */
function Icon({ name }: { name: string }): ReactNode {
  return (
    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
      {name}
    </span>
  );
}

/** Shared chrome for every authenticated screen: primary nav + log out, styled as a fixed left sidebar. */
export function AuthenticatedNav() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleLogout(): Promise<void> {
    await signOut();
    router.push('/login');
  }

  return (
    <nav
      aria-label="Main"
      className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col gap-2 border-r border-outline-variant bg-surface-container-lowest p-4 md:flex"
    >
      <div className="mb-4 flex items-center gap-3 border-b border-outline-variant px-2 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <Icon name="account_balance_wallet" />
        </div>
        <span className="text-headline-sm font-black text-primary">Finanzas</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
        <Button
          type="button"
          variant="secondary"
          className="!w-full !justify-start !border-0 px-4 py-3 text-on-surface-variant hover:bg-surface-container"
          onClick={() => void handleLogout()}
        >
          <Icon name="logout" />
          Log out
        </Button>
      </div>
    </nav>
  );
}
