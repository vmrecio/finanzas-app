import Link from 'next/link';
import { LoginContainer } from '../../containers/LoginContainer';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-headline-lg text-on-surface">Log in</h1>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Enter your credentials to access your account.
          </p>
        </div>
        <LoginContainer />
        <p className="mt-8 text-center text-body-sm text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
