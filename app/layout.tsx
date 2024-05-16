import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

import clsx from 'clsx';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import { ToastContainer } from 'react-toastify';

import { Navbar } from '@/components/navbar';
import { fontSans } from '@/config/fonts';
import { siteConfig } from '@/config/site';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={clsx(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'white' }}>
          <Navbar />
          <div className="relative flex h-auto flex-col">
            <main className="container mx-auto min-h-screen-minus-navbar max-w-7xl grow px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>

        <ToastContainer />
      </body>
    </html>
  );
}
