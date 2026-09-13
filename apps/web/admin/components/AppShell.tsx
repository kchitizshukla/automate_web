'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  loadNotifications,
  markAllNotificationsRead,
  useNotifications,
} from '@/lib/notificationsStore';
import { classNames, formatDateTime } from '@automate/shared-utils';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui';
import { FullScreenLoader } from '@/components/BrandLoader';
import { notify, Drawer, PageTransition } from '@/components/kit';

const ROLE = { label: 'Admin', tint: 'bg-amber-500/15 text-amber-200 ring-amber-400/30' };

const NAV = [
  { href: '/', label: 'Dashboard', icon: '◎' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/mechanics', label: 'Mechanics', icon: '⚙️' },
  { href: '/approvals', label: 'Approvals', icon: '✅' },
  { href: '/services', label: 'Services', icon: '🛠' },
  { href: '/assign', label: 'Assign Jobs', icon: '➜' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/logs', label: 'Logs', icon: '📜' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

const TABS = [
  { href: '/', label: 'Home', icon: '◎' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/approvals', label: 'Approve', icon: '✅' },
  { href: '/payments', label: 'Pay', icon: '💳' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

const PUBLIC_ROUTES = ['/login', '/signup'];

function Wordmark({ light, compact }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-aurora text-white shadow-glow">⚡</span>
      {!compact && <span className={classNames('font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>AutoMate</span>}
    </Link>
  );
}

function NavLinks({ collapsed, onNavigate, light }: { collapsed?: boolean; onNavigate?: () => void; light?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={classNames(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              collapsed && 'justify-center px-0',
              active ? 'bg-white/10 text-white shadow-glow ring-1 ring-white/15' : light ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-aurora" />}
            <span className="text-base opacity-90" aria-hidden>{item.icon}</span>
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotifBell() {
  // Shared with the /notifications page so marking one read there moves this
  // badge too, instead of leaving it stale until a reload.
  const { items, unread } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications().catch(() => {
      /* silent */
    });
  }, []);

  async function markAll() {
    try {
      const n = await markAllNotificationsRead();
      if (n) notify.success('All notifications marked read');
    } catch {
      notify.error('Could not mark notifications read');
    }
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 text-lg transition hover:bg-white">
        🔔
        {unread > 0 && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Notifications">
        <div className="flex items-center justify-end px-1 pb-2">
          {unread > 0 && <button onClick={markAll} className="text-xs font-semibold text-brand hover:underline">Mark all read</button>}
        </div>
        <div>
          {items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-400">You&apos;re all caught up ✨</p> : items.slice(0, 8).map((n) => (
            <div key={n.id} className={classNames('rounded-xl px-3 py-2.5 transition hover:bg-slate-100/70', !n.read && 'bg-brand/5')}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/notifications" onClick={() => setOpen(false)} className="mt-1 block rounded-xl py-2 text-center text-sm font-semibold text-brand hover:bg-brand/5">View all →</Link>
      </Drawer>
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 py-1.5 pl-1.5 pr-3 transition hover:bg-white">
        <Avatar name={user?.name} />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold text-slate-800">{user?.name}</span>
          <span className="block text-[11px] text-slate-400">Administrator</span>
        </span>
        <span className="text-slate-400">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }} className="glass absolute right-0 z-50 mt-2 w-56 rounded-2xl p-2 shadow-xl">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <Link href="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">👤 Profile</Link>
            <Link href="/logs" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">📜 System logs</Link>
            <button onClick={logout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-slate-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">↩ Sign out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => { if (ready && !user && !isPublic) router.replace('/login'); }, [ready, user, isPublic, router]);
  useEffect(() => { try { setCollapsed(localStorage.getItem('am_sidebar') === '1'); } catch { /* */ } }, []);
  function toggleCollapse() {
    setCollapsed((c) => { const next = !c; try { localStorage.setItem('am_sidebar', next ? '1' : '0'); } catch { /* */ } return next; });
  }

  if (isPublic) return <>{children}</>;
  // One gate for both halves of the check, so the console never flashes
  // before it knows whether this visitor is signed in.
  if (!ready || !user) {
    return (
      <FullScreenLoader
        label="Checking your session…"
        detail="Just a moment while we open the console."
      />
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className={classNames('sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/5 bg-slate-900 p-4 transition-[width] duration-300 lg:flex', collapsed ? 'w-20' : 'w-72')}>
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(30rem 30rem at 120% -10%, rgba(249,115,22,0.25), transparent 60%), radial-gradient(24rem 24rem at -10% 110%, rgba(244,63,94,0.18), transparent 60%)' }} />
        <div className={classNames('relative mb-7 flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
          <Wordmark light compact={collapsed} />
          {!collapsed && <button onClick={toggleCollapse} aria-label="Collapse sidebar" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">⟨</button>}
        </div>
        {collapsed && <button onClick={toggleCollapse} aria-label="Expand sidebar" className="relative mb-3 grid h-7 w-full place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">⟩</button>}
        <div className="relative flex-1 overflow-y-auto"><NavLinks light collapsed={collapsed} /></div>
        {!collapsed && (
          <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10">Sign out</button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200/60 bg-white/70 px-6 py-3 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">Admin Console</span>
            <p className="text-sm text-slate-500">Platform overview &amp; operations</p>
          </div>
          <div className="flex items-center gap-3">
            <NotifBell />
            <ProfileMenu />
          </div>
        </header>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3 lg:hidden">
          <Wordmark light />
          <div className="flex items-center gap-2">
            <span className={classNames('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset', ROLE.tint)}>{ROLE.label}</span>
            <button aria-label="Toggle navigation" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white">{open ? '✕' : '☰'}</button>
          </div>
        </header>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/10 bg-slate-900 lg:hidden">
              <div className="px-4 py-4">
                <NavLinks light onNavigate={() => setOpen(false)} />
                <button onClick={logout} className="mt-3 w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Sign out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 pb-20 lg:pb-0">
          <div className="w-full max-w-none px-4 py-7 sm:px-6 lg:px-8 lg:py-8"><PageTransition>{children}</PageTransition></div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate-200 bg-white/90 backdrop-blur-xl lg:hidden">
          {TABS.map((t) => {
            const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={classNames('flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition', active ? 'text-brand' : 'text-slate-400')}>
                <span className={classNames('text-lg transition', active && 'scale-110')}>{t.icon}</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
