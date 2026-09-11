'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { classNames, statusColor, statusLabel } from '@automate/shared-utils';
import { BrandLoader, FullScreenLoader, InlineLoader } from './BrandLoader';

/* ── Loading / skeleton ─────────────────────── */
// One mark for the whole product — see components/BrandLoader.tsx.
export { BrandLoader, FullScreenLoader, InlineLoader };

export function Loading({ label = 'Loading…', size = 40 }: { label?: string; size?: number }) {
  return <InlineLoader label={label} size={size} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('shimmer rounded-lg', className)} />;
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/* ── Error / empty ──────────────────────────── */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/70 p-8 text-center">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-red-100 text-xl">⚠️</div>
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, hint, icon = '✨', children }: { title: string; hint?: string; icon?: string; children?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">{icon}</div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* ── Status badge (dot + soft tint) ─────────── */
const DOT: Record<string, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
};
const DOTCOLOR: Record<string, string> = {
  green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-gray-400',
};
export function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  return (
    <span className={classNames('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', DOT[c] ?? DOT.gray)}>
      <span className={classNames('h-1.5 w-1.5 rounded-full', DOTCOLOR[c] ?? DOTCOLOR.gray)} />
      {statusLabel(status)}
    </span>
  );
}

/* ── Card / surfaces ────────────────────────── */
export function Card({ className, children, hover }: { className?: string; children: React.ReactNode; hover?: boolean }) {
  return (
    <div
      className={classNames(
        'glass rounded-2xl p-5 transition duration-300',
        hover && 'hover:-translate-y-0.5 hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Stat card with gradient ring + trend ───── */
export function StatCard({ label, value, icon, trend, accent = 'emerald' }: { label: string; value: React.ReactNode; icon?: string; trend?: string; accent?: 'indigo' | 'violet' | 'sky' | 'emerald' | 'amber' | 'teal' | 'cyan' }) {
  const rings: Record<string, string> = {
    indigo: 'from-indigo-500/15 to-indigo-500/0 text-indigo-600',
    violet: 'from-violet-500/15 to-violet-500/0 text-violet-600',
    sky: 'from-sky-500/15 to-sky-500/0 text-sky-600',
    emerald: 'from-emerald-500/15 to-emerald-500/0 text-emerald-600',
    teal: 'from-teal-500/15 to-teal-500/0 text-teal-600',
    cyan: 'from-cyan-500/15 to-cyan-500/0 text-cyan-600',
    amber: 'from-amber-500/15 to-amber-500/0 text-amber-600',
  };
  return (
    <Card hover className="relative overflow-hidden">
      <div className={classNames('pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-xl', rings[accent])} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {icon && <span className={classNames('grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-lg', rings[accent])}>{icon}</span>}
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</div>
      {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
    </Card>
  );
}

/* ── Page header ────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Form primitives ────────────────────────── */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15';

/**
 * `loading` is the button-level half of the app's loading system: the mark
 * from BrandLoader in the button's own text colour, and the button disabled
 * for as long as it shows. Anything that awaits should pass it rather than
 * only swapping the label — the disable is what stops a second submit, and
 * the mark is what says the first one is still running.
 */
export function Button({ children, className, variant = 'primary', loading = false, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }) {
  const variants: Record<string, string> = {
    primary: 'bg-aurora text-white shadow-glow hover:brightness-110',
    secondary: 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        loading && 'disabled:cursor-progress',
        variants[variant],
        className,
      )}
    >
      {loading && <BrandLoader size={16} monochrome />}
      {children}
    </button>
  );
}

/* ── Star rating (display + interactive) ────── */
export function Stars({ value, size = 'sm', onChange }: { value: number; size?: 'sm' | 'lg'; onChange?: (n: number) => void }) {
  const cls = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={classNames('inline-flex', cls)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={classNames(onChange ? 'cursor-pointer transition hover:scale-110' : 'cursor-default', 'leading-none')}
          aria-label={`${n} star`}
        >
          <span className={n <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'}>★</span>
        </button>
      ))}
    </span>
  );
}

export function Avatar({ name, accent = 'bg-aurora' }: { name?: string; accent?: string }) {
  const initials = (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <span className={classNames('grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white', accent)}>{initials}</span>;
}

/* ── Custom Select (animated glass dropdown) ─── */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  hint?: string;
}
interface SelectProps {
  value: string | number;
  onChange: (val: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}
export function Select({ value, onChange, options, placeholder = 'Select…', className }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    reposition();
    function onDown(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, reposition]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={classNames('relative', className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={classNames(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all duration-200 backdrop-blur-sm',
          open
            ? 'border-brand shadow-sm ring-4 ring-brand/15'
            : 'border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-sm',
        )}
      >
        <span className={classNames('truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={classNames('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {mounted && open && coords && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="dropdown-panel max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
        >
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSel}
                disabled={opt.disabled}
                onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                className={classNames(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                  isSel ? 'bg-brand/10 font-medium text-brand' : 'text-slate-700 hover:bg-slate-100/80',
                  opt.disabled && 'cursor-not-allowed opacity-40',
                )}
              >
                <span className={classNames('flex h-4 w-4 shrink-0 items-center justify-center', !isSel && 'opacity-0')}>
                  <svg className="h-3.5 w-3.5 text-brand" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 11.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
                {opt.hint && <span className="text-xs text-slate-400">{opt.hint}</span>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
