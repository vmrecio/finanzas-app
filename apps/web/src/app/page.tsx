import Link from 'next/link';

interface QuickAccessLink {
  href: string;
  label: string;
  icon: string;
}

// The real, existing authenticated screens — nothing invented here.
const QUICK_ACCESS: QuickAccessLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/accounts', label: 'Accounts', icon: 'account_balance' },
  { href: '/categories', label: 'Categories', icon: 'category' },
  { href: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { href: '/budgets', label: 'Budgets', icon: 'savings' },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-surface text-on-surface">
      <nav className="w-full border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <span className="text-headline-sm font-bold text-primary">Finanzas</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-transparent px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-body-md font-medium text-on-primary transition-opacity hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-grow flex-col items-center justify-center px-4 py-24 md:px-8">
        <div className="mb-16 w-full max-w-4xl space-y-8 text-center">
          <h1 className="text-display-lg text-on-surface">Finanzas</h1>
          <p className="mx-auto max-w-2xl text-headline-lg font-light text-on-surface-variant">
            Personal finance management.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-lg bg-primary px-8 py-3 text-center text-body-md font-medium text-on-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-outline bg-surface-container-lowest px-8 py-3 text-center text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container-low sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <p className="mb-6 text-center text-label-caps text-outline">Quick access</p>
          <nav aria-label="Quick access" className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
            {QUICK_ACCESS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-all duration-300 hover:border-primary hover:shadow-[0px_12px_32px_rgba(15,23,42,0.1)]"
              >
                <span
                  className="material-symbols-outlined mb-3 text-3xl text-primary transition-transform group-hover:scale-110"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="text-body-sm font-medium text-on-surface">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container-highest">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-4 py-8 text-body-sm text-on-surface-variant md:flex-row md:px-8">
          <span className="font-bold text-on-surface">Finanzas</span>
          <span>© {new Date().getFullYear()} Finanzas Personal Finance</span>
        </div>
      </footer>
    </main>
  );
}
