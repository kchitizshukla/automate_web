'use client';

import React from 'react';

/* Branded split-screen shell shared by /login and /signup (admin console). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(36rem 36rem at 110% -10%, rgba(249,115,22,0.5), transparent 60%), radial-gradient(30rem 30rem at -10% 110%, rgba(244,63,94,0.4), transparent 60%), radial-gradient(24rem 24rem at 50% 60%, rgba(245,158,11,0.25), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl ring-1 ring-white/20">⚡</span>
          <span className="font-display text-xl font-extrabold">AutoMate</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Run the platform<br />from <span className="text-gradient">one console.</span>
          </h1>
          <p className="mt-4 max-w-sm text-slate-300">
            Approve vendors, assign jobs, reconcile payments, and keep an eye on every metric in real time.
          </p>
          <div className="mt-8 flex gap-6">
            {[['320+', 'Workshops'], ['12k+', 'Repairs done'], ['99.9%', 'Uptime']].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold">{n}</p>
                <p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 AutoMate · Admin Console</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-extrabold">AutoMate</span>
            <span className="ml-2 text-sm font-medium uppercase tracking-widest text-brand">Admin</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
