'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { SwitchRoleLink } from '@/components/SwitchRoleLink';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button, Field, inputClass } from '@/components/ui';
import { PasswordField } from '@/components/PasswordField';
import { notify } from '@/components/kit';
import { validatePasswordPair } from '@automate/shared-utils';
import { ApiError } from '@automate/shared-api';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Synchronous latch: state updates are async, so rapid clicks would all
  // pass a `busy` check within the same tick.
  const submitting = useRef(false);

  // One shared rule set drives the message, the field styling and the button.
  const pw = validatePasswordPair(form.password, form.confirmPassword);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // synchronous double-submit guard

    // Re-checked here, never trusting the button's disabled state alone.
    const check = validatePasswordPair(form.password, form.confirmPassword);
    if (!check.valid) {
      const message = check.error ?? 'Please enter and confirm your password.';
      setError(message);
      notify.error(message);
      return;
    }

    setError('');
    submitting.current = true;
    setBusy(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">
            Fix<span className="text-brand">My</span>Ride
          </h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputClass}
            />
          </Field>
          <PasswordField
            label="Create password"
            value={form.password}
            onChange={(v) => set('password', v)}
            placeholder="••••••••"
          />
          <PasswordField
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(v) => set('confirmPassword', v)}
            placeholder="••••••••"
            invalid={pw.mismatch}
            hint={pw.error ?? undefined}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={busy} disabled={!pw.valid} className="w-full">
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand">
            Sign in
          </Link>
        </p>
        <SwitchRoleLink className="mt-3" />
      </div>
    </div>
  );
}
