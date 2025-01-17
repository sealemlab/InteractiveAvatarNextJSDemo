import '@/styles/globals.css';
import clsx from 'clsx';
import { Metadata, Viewport } from 'next';

import { Providers } from './providers';

import { Fira_Code as FontMono, Inter as FontSans } from 'next/font/google';
import NavBar from '@/components/NavBar';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: {
    default: 'Aigree',
    template: `%s - Aigree`
  },
  icons: {
    icon: '/aigree-logo.webp'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // className={`${fontSans.variable} ${fontMono.variable} font-sans`}
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx('min-h-screen bg-background antialiased')}>
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'light' }}>
          <main className="relative flex flex-col h-screen">
            <NavBar />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
