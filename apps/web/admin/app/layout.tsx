import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './providers';
// Mounted at the root so toasts and the loader also cover login and sign-up,
// which render outside the authenticated Shell.
import { AppToaster } from '@/components/kit';
import { GlobalLoader } from '@/components/GlobalLoader';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'AutoMate • Admin',
  description: 'AutoMate administration console',
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
          <GlobalLoader />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
