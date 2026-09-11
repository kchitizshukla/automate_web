import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './providers';
// Mounted at the root so toasts and the loader also cover login and sign-up,
// which render outside the authenticated Shell.
import { AppToaster } from '@/components/kit';
import { GlobalLoader } from '@/components/GlobalLoader';

export const metadata: Metadata = {
  title: 'AutoMate • Mechanic',
  description: 'Mechanic workspace for AutoMate',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppToaster />
          <GlobalLoader />{children}</AuthProvider>
      </body>
    </html>
  );
}
