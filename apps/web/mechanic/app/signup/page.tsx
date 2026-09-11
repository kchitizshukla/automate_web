'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { SwitchRoleLink } from '@/components/SwitchRoleLink';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@automate/shared-utils';
import { useAuth } from '@/app/providers';
import { Button, Field, inputClass } from '@/components/ui';
import { notify } from '@/components/kit';
import { PasswordField } from '@/components/PasswordField';
import { validatePasswordPair } from '@automate/shared-utils';
import { ApiError } from '@automate/shared-api';

export default function SignupPage() {
  const router = useRouter();
  const { signup, logout } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', specialization: '',
    workshopName: '', address: '', certifications: '', pricingModel: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Synchronous latch: state updates are async, so rapid clicks would all
  // pass a `busy` check within the same tick.
  const submitting = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  // One shared rule set drives the message, the field styling and the button.
  const pw = validatePasswordPair(form.password, form.confirmPassword);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (submitting.current) return; // synchronous double-submit guard

    // Existing required-field rule preserved, then the password pair rules.
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      notify.error('Name, email and password are required.');
      return;
    }

    // Re-checked here, never trusting the button's disabled state alone.
    const check = validatePasswordPair(form.password, form.confirmPassword);
    if (!check.valid) {
      const message = check.error ?? 'Please enter and confirm your password.';
      setError(message);
      notify.error(message);
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        skills: form.specialization || undefined,
        specialization: form.specialization || undefined,
        workshopName: form.workshopName || undefined,
        address: form.address || undefined,
        certifications: form.certifications || undefined,
        pricingModel: form.pricingModel || undefined,
      });
      // Account is created as 'pending'; clear the session and show approval notice.
      logout();
      setSubmitted(true);
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(36rem 36rem at 110% -10%, rgba(20,184,166,0.5), transparent 60%), radial-gradient(30rem 30rem at -10% 110%, rgba(6,182,212,0.4), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl ring-1 ring-white/20">⚡</span>
          <span className="font-display text-xl font-extrabold">AutoMate</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Grow your <span className="text-gradient">workshop business.</span>
          </h1>
          <p className="mt-4 max-w-sm text-slate-300">
            Join AutoMate as a verified mechanic. New vendors are reviewed by our team before going live.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 AutoMate · Mechanic Portal</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-rise">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">✅</div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Registration submitted</h2>
              <p className="mt-2 text-sm text-slate-500">
                Your workshop is now <span className="font-semibold text-amber-600">pending admin approval</span>. You’ll be able to log in once an admin approves your account.
              </p>
              <Link href="/login" className="mt-6 inline-flex rounded-xl bg-aurora px-5 py-2.5 text-sm font-semibold text-white shadow-glow">Go to login</Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-slate-900">Register your workshop</h2>
              <p className="mt-1 text-sm text-slate-500">Onboard as a verified mechanic on AutoMate.</p>

              <form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputClass} placeholder="Ravi Kumar" /></Field>
                <Field label="Email"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputClass} placeholder="you@example.com" /></Field>
                <PasswordField label="Create password" value={form.password} onChange={(v) => set('password', v)} placeholder="••••••••" />
                <PasswordField label="Confirm password" value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} placeholder="••••••••" invalid={pw.mismatch} hint={pw.error ?? undefined} />
                <Field label="Phone"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" /></Field>
                <div className="sm:col-span-2"><Field label="Workshop name"><input value={form.workshopName} onChange={(e) => set('workshopName', e.target.value)} className={inputClass} placeholder="Ravi Auto Works" /></Field></div>
                <div className="sm:col-span-2"><Field label="Address"><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="12 MG Road, Bengaluru" /></Field></div>
                <Field label="Specializations"><input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} className={inputClass} placeholder="Engine & Brakes" /></Field>
                <Field label="Pricing model"><input value={form.pricingModel} onChange={(e) => set('pricingModel', e.target.value)} className={inputClass} placeholder="Fixed + Hourly" /></Field>
                <div className="sm:col-span-2"><Field label="Certifications"><input value={form.certifications} onChange={(e) => set('certifications', e.target.value)} className={inputClass} placeholder="ASE Certified, Bosch Trained" /></Field></div>
                {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <p className="sm:col-span-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">Your account will be activated after admin approval.</p>
                <div className="sm:col-span-2"><Button type="submit" loading={busy} disabled={!pw.valid} className="w-full">{busy ? 'Submitting…' : 'Submit registration →'}</Button></div>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
              </p>
              <SwitchRoleLink className="mt-3" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
