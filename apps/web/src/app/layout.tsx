import type { Metadata } from 'next';
import { AuthProvider } from '../containers/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finanzas',
  description: 'Personal finance management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
