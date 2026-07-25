import type { ReactNode } from 'react';
import { AuthenticatedNav } from '../../containers/AuthenticatedNav';
import { RequireAuth } from '../../containers/RequireAuth';

/**
 * Common chrome for every authenticated screen (Dashboard/Accounts/
 * Categories/Transactions/Budgets): a single route guard plus shared nav +
 * log out, via a Next.js route group so none of these routes' URLs change.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AuthenticatedNav />
      {children}
    </RequireAuth>
  );
}
