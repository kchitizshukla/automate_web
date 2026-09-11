'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { TOKEN_KEY } from '@/lib/config';
import { Shell } from '@/components/Shell';
import { FullScreenLoader } from '@/components/BrandLoader';

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;
    if (!token) {
      router.replace('/login');
    } else {
      setAllowed(true);
    }
  }, [ready, router]);

  // One gate for both halves of the check, so the app never flashes the
  // dashboard or the login page before it knows which one is true.
  if (!ready || !allowed) {
    return (
      <FullScreenLoader
        label="Checking your session…"
        detail="Just a moment while we get you signed in."
      />
    );
  }

  return <Shell>{children}</Shell>;
}
