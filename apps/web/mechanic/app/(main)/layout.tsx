import React from 'react';
import { Protected } from '@/components/Protected';
import { IncomingRequestPanel } from '@/components/nearby/IncomingRequestPanel';

// All authenticated mechanic routes render inside Protected, which checks the
// session and wraps content in the Shell (sidebar + nav). Login/signup live
// outside this route group, so they stay full-screen.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      {children}
      {/* Mounted once here so a roadside request reaches the mechanic on
          whichever authenticated screen they happen to be on. */}
      <IncomingRequestPanel />
    </Protected>
  );
}
