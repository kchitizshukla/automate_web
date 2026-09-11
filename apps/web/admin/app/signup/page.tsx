'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { SwitchRoleLink } from '@/components/SwitchRoleLink';
import { useRouter } from 'next/navigation';
import { isValidEmail, validatePasswordPair } from '@automate/shared-utils';
import { ApiError } from '@automate/shared-api';
import { useAuth } from '@/app/providers';
import { Button, Field, inputClass } from '@/components/ui';
import { AuthShell } from '@/components/AuthShell';
import { PasswordField } from '@/components/PasswordField';
import { notify } from '@/components/kit';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Synchronous latch: state updates are async, so rapid clicks would all
  // pass a `busy` check within the same tick.
  const submitting = useRef(false);

  // One shared rule set drives the message, the field styling and the button.
  const pw = validatePasswordPair(password, confirmPassword);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (submitting.current) return; // synchronous double-submit guard

    // Existing name/email rules preserved, then the password pair rules.
    if (!name.trim()) {
      setError('Please enter your name.');
      notify.error('Please enter your name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      notify.error('Please enter a valid email address.');
      return;
    }

    // Re-checked here, never trusting the button's disabled state alone.
    const check = validatePasswordPair(password, confirmPassword);
    if (!check.valid) {
      const message = check.error ?? 'Please enter and confirm your password.';
      setError(message);
      notify.error(message);
      return;
    }

    submitting.current = true;
    setBusy(true);
    try {
      await signup({ name, email, password });
      router.replace('/');
    } catch (err) {
      // The shared client already toasted this one; showing it inline as well
      // would tell the user the same thing twice.
      if (!(err instanceof ApiError && err.handled)) {
        setError(err instanceof Error ? err.message : 'Signup failed');
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h2 className="font-display text-2xl font-bold text-slate-900">Create admin account</h2>
      <p className="mt-1 text-sm text-slate-500">Register a new administrator.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Jane Admin" /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="admin@automate.com" /></Field>
        <PasswordField label="Create password" value={password} onChange={setPassword} placeholder="••••••••" />
        <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" invalid={pw.mismatch} hint={pw.error ?? undefined} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={busy} disabled={!pw.valid} className="w-full">{busy ? 'Creating…' : 'Create account →'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
      </p>
      <SwitchRoleLink className="mt-3" />
    </AuthShell>
  );
}
