'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { SwitchRoleLink } from '@/components/SwitchRoleLink';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button, Field, inputClass } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('aarav@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Synchronous latch: state updates are async, so rapid clicks would all
  // pass a `busy` check within the same tick.
  const submitting = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // synchronous double-submit guard
    setError('');
    submitting.current = true;
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      // Always released — a failed login must never leave the form locked.
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / showcase panel */}
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(36rem 36rem at 110% -10%, rgba(139,92,246,0.5), transparent 60%), radial-gradient(30rem 30rem at -10% 110%, rgba(14,165,233,0.4), transparent 60%), radial-gradient(24rem 24rem at 50% 60%, rgba(99,102,241,0.25), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl ring-1 ring-white/20">⚡</span>
          <span className="font-display text-xl font-extrabold">AutoMate</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Vehicle trouble?<br />Fixed in <span className="text-gradient">a few taps.</span>
          </h1>
          <p className="mt-4 max-w-sm text-slate-300">
            Discover verified mechanics, book instantly, pay securely, and track every repair in real time.
          </p>
          <div className="mt-8 flex gap-6">
            {[['4.8★', 'Avg. rating'], ['12k+', 'Repairs done'], ['320+', 'Workshops']].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold">{n}</p>
                <p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 AutoMate · Customer Portal</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-extrabold">AutoMate</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your vehicles & bookings.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
            </Field>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in →'}</Button>
          </form>

          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Demo: <span className="font-medium text-slate-700">aarav@example.com</span> / <span className="font-medium text-slate-700">password123</span>
          </p>
          <p className="mt-6 text-center text-sm text-slate-500">
            No account? <Link href="/signup" className="font-semibold text-brand hover:underline">Create one</Link>
          </p>
          <SwitchRoleLink className="mt-3" />
        </div>
      </div>
    </div>
  );
}
