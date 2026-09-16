import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '../containers/auth-context';
import './globals.css';

// next/font self-hosts + subsets these at build time (no runtime Google
// Fonts request, no layout-shift) and exposes them as CSS variables wired
// into the `--font-sans`/`--font-mono` theme tokens in globals.css.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/*
          Material Symbols Outlined: kept as a font-stylesheet link (per
          issue #20's guidance) rather than next/font, which doesn't support
          Google's variable icon-font axes cleanly. `display=swap` avoids a
          layout-shift-prone blocking load.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout, not pages/_document; this link is shared by every route. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
