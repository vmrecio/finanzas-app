import Link from 'next/link';
import { RegisterContainer } from '../../containers/RegisterContainer';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-headline-lg text-on-surface">Create account</h1>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Start tracking your finances in minutes.
          </p>
        </div>
        <RegisterContainer />
        <p className="mt-8 text-center text-body-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
