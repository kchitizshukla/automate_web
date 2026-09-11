import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleProvider } from './providers';
// Mounted at the root so the overlay covers the landing page and every
// `/<role>/auth` hand-off from a single instance.
import { LoaderProvider } from '@/components/GlobalLoader';
import { APP_NAME, TAGLINE, SUBTEXT, palette } from '@automate/shared-brand';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description: SUBTEXT,
  applicationName: APP_NAME,
  openGraph: {
    title: `${APP_NAME} — ${TAGLINE}`,
    description: SUBTEXT,
    siteName: APP_NAME,
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: palette.void,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <LoaderProvider>{children}</LoaderProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
