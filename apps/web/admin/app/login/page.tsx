'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { SwitchRoleLink } from '@/components/SwitchRoleLink';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@automate/shared-utils';
import { useAuth } from '@/app/providers';
import { Button, Field, inputClass } from '@/components/ui';
import { AuthShell } from '@/components/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
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
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
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
    <AuthShell>
      <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-500">Sign in to the AutoMate admin console.</p>

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
        Demo: <span className="font-medium text-slate-700">admin@example.com</span> / <span className="font-medium text-slate-700">password123</span>
      </p>
      <p className="mt-6 text-center text-sm text-slate-500">
        No account? <Link href="/signup" className="font-semibold text-brand hover:underline">Create one</Link>
      </p>
      <SwitchRoleLink className="mt-3" />
    </AuthShell>
  );
}
