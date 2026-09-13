'use client';

/* ──────────────────────────────────────────────
   AutoMate — shared interaction kit
   Motion · Toasts · Modal · Tooltip · Breadcrumbs
   Tabs · Stepper · DataTable · Carousel · DatePicker
   Built on the existing Aurora tokens (glass / brand / bg-aurora).
   ────────────────────────────────────────────── */

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { classNames } from '@automate/shared-utils';
import { DUR, EASE, hoverLift, pageVariants, tap, transition } from '@/lib/motion';

/* ── Motion helpers ─────────────────────────── */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Toasts ─────────────────────────────────── */
export function AppToaster() {
  return (
    <Toaster
      // Top-centre, sliding down into view. containerStyle sits above every
      // overlay in the app (modals use z-50, the searching overlay z-60).
      position="top-center"
      containerStyle={{ top: 20, zIndex: 9999 }}
      gutter={10}
      toastOptions={{
        duration: 4200,
        className: 'am-toast',
        style: {
          maxWidth: 'min(92vw, 30rem)',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(14px)',
          color: '#0f172a',
          border: '1px solid rgba(226,232,240,0.9)',
          borderRadius: '1rem',
          boxShadow: '0 18px 40px -16px rgba(15,23,42,0.35)',
          padding: '0.8rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.35,
          // Long messages wrap instead of stretching the toast off screen.
          overflowWrap: 'anywhere',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: {
          duration: 5200, // errors need longer to read than confirmations
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          style: {
            background: 'rgba(254,242,242,0.97)',
            border: '1px solid #fecaca',
            color: '#7f1d1d',
          },
        },
      }}
    />
  );
}

/** Same text within the dedupe window reuses one toast instead of stacking. */
const toastId = (msg: string) => `am-${msg.slice(0, 80)}`;

export const notify = {
  success: (msg: string) => toast.success(msg, { id: toastId(msg) }),
  error: (msg: string) => toast.error(msg, { id: toastId(msg) }),
  info: (msg: string) => toast(msg, { icon: 'ℹ️', id: toastId(msg) }),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id?: string) => toast.dismiss(id),
  promise: <T,>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    toast.promise(p, msgs),
};

/* Overlay portal */
/**
 * Renders a full-screen overlay into <body>.
 *
 * A position:fixed element is laid out against the nearest ancestor carrying a
 * transform, filter or backdrop-filter - not the viewport. The app header uses
 * backdrop-blur, so an overlay opened from the header (the notification bell)
 * was sized to the header's ~76px instead of the full screen, and its rows
 * rendered outside the visible panel. Portalling to <body> keeps these
 * anchored to the viewport wherever they are triggered from.
 */
function OverlayPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* ── Modal / Dialog ─────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className={classNames('glass relative z-10 w-full rounded-2xl p-6', widths[size])}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {title && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="text-center">
        <div
          className={classNames(
            'mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl',
            tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-brand/10 text-brand',
          )}
        >
          {tone === 'danger' ? '⚠️' : '❓'}
        </div>
        <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-slate-500">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={classNames(
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50',
              tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-aurora shadow-glow hover:brightness-110',
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Tooltip ────────────────────────────────── */
export function Tooltip({
  label,
  children,
  side = 'top',
}: {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}) {
  const pos =
    side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={classNames(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100',
          pos,
        )}
      >
        {label}
      </span>
    </span>
  );
}

/* ── Breadcrumbs ────────────────────────────── */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {it.href && !last ? (
              <Link href={it.href} className="font-medium transition hover:text-brand">
                {it.label}
              </Link>
            ) : (
              <span className={last ? 'font-semibold text-slate-700' : ''}>{it.label}</span>
            )}
            {!last && <span className="text-slate-300">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

/* ── Tabs ───────────────────────────────────── */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon?: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/70 bg-white/60 p-1 backdrop-blur">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={classNames(
              'relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
              on ? 'text-white' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {on && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-xl bg-aurora shadow-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.icon}</span>
            <span className="relative">{t.label}</span>
            {typeof t.count === 'number' && (
              <span
                className={classNames(
                  'relative rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  on ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Stepper (booking / progress) ───────────── */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.1 : 1 }}
                className={classNames(
                  'grid h-9 w-9 place-items-center rounded-full text-sm font-bold ring-2 transition',
                  done
                    ? 'bg-aurora text-white ring-transparent'
                    : active
                      ? 'bg-white text-brand ring-brand'
                      : 'bg-white text-slate-400 ring-slate-200',
                )}
              >
                {done ? '✓' : i + 1}
              </motion.span>
              <span
                className={classNames(
                  'mt-1.5 hidden text-xs font-medium sm:block',
                  active ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 h-0.5 flex-1 rounded-full bg-slate-200">
                <motion.span
                  className="block h-full rounded-full bg-aurora"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Chip ───────────────────────────────────── */
export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-aurora text-white shadow-glow'
          : 'border border-slate-200 bg-white/70 text-slate-600 hover:border-brand/40 hover:text-brand',
      )}
    >
      {children}
    </button>
  );
}

/* ── Floating-label input ───────────────────── */
export function FloatingInput({
  label,
  className,
  id,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const inputId = id || `fi-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={classNames('relative', className)}>
      <input
        id={inputId}
        placeholder=" "
        {...rest}
        className="peer w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 pb-2 pt-5 text-sm text-slate-900 outline-none transition placeholder:text-transparent focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <label
        htmlFor={inputId}
        className="pointer-events-none absolute left-3.5 top-2 text-[11px] font-medium text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-brand"
      >
        {label}
      </label>
    </div>
  );
}

/* ── DatePicker (lightweight calendar) ──────── */
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Pick a date',
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: Date;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const selected = value ? new Date(value) : null;
  const [view, setView] = React.useState(() => selected || new Date());

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

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const minTime = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime() : -Infinity;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={classNames(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white/80 px-3.5 py-2.5 text-sm outline-none transition',
          open ? 'border-brand ring-4 ring-brand/15' : 'border-slate-200 hover:border-slate-300',
        )}
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected
            ? selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : placeholder}
        </span>
        <span className="text-slate-400">📅</span>
      </button>
      {mounted && open && coords && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: Math.max(coords.width, 288), zIndex: 9999 }}
          className="dropdown-panel rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">‹</button>
            <span className="text-sm font-semibold text-slate-800">{MONTHS[month]} {year}</span>
            <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
            {WD.map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: first }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const date = new Date(year, month, d);
              const disabled = date.getTime() < minTime;
              const isSel = selected && date.toDateString() === selected.toDateString();
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(date.toISOString()); setOpen(false); }}
                  className={classNames(
                    'grid h-8 place-items-center rounded-lg text-sm transition',
                    isSel ? 'bg-aurora font-bold text-white shadow-glow' : 'text-slate-700 hover:bg-slate-100',
                    disabled && 'cursor-not-allowed text-slate-300 hover:bg-transparent',
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ── Carousel ───────────────────────────────── */
export function Carousel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: 'smooth' });
  }
  return (
    <div className={classNames('group relative', className)}>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Previous"
        onClick={() => scroll(-1)}
        className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:scale-110 group-hover:grid"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => scroll(1)}
        className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:scale-110 group-hover:grid"
      >
        ›
      </button>
    </div>
  );
}

/* ── DataTable (sort · filter · paginate) ───── */
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchKeys,
  pageSize = 8,
  searchPlaceholder = 'Search…',
  rowKey,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  searchPlaceholder?: string;
  rowKey?: (row: T, i: number) => React.Key;
  toolbar?: React.ReactNode;
}) {
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    let r = rows;
    if (q && searchKeys?.length) {
      const needle = q.toLowerCase();
      r = r.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(needle)),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        r = [...r].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return -1 * sort.dir;
          if (av > bv) return 1 * sort.dir;
          return 0;
        });
      }
    }
    return r;
  }, [rows, q, sort, columns, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => { setPage(0); }, [q, sort]);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  }

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-64 max-w-full rounded-xl border border-slate-200 bg-white/80 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortValue && toggleSort(c.key)}
                  className={classNames(
                    'whitespace-nowrap border-b border-slate-100 bg-white/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 backdrop-blur',
                    c.sortValue && 'cursor-pointer select-none hover:text-slate-700',
                    c.className,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortValue && (
                      <span className="text-[10px]">
                        {sort?.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  No matching records.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={rowKey ? rowKey(row, i) : i} className="transition hover:bg-slate-50/80">
                  {columns.map((c) => (
                    <td key={c.key} className={classNames('whitespace-nowrap px-4 py-3.5 text-slate-600', c.className)}>
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm text-slate-500">
        <span>
          {filtered.length === 0 ? 0 : safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 font-medium transition hover:bg-white disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="px-2 text-xs font-semibold text-slate-600">
            Page {safePage + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 font-medium transition hover:bg-white disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Animated interaction primitives
   AnimatedButton · AnimatedCard · MotionWrapper
   PageTransition · CountUp · CircularProgress
   FlipCard · Timeline · SwipeToAccept · Drawer
   Greeting · AnimatedEmpty · confetti · skeletons
   ════════════════════════════════════════════════ */

/* ── AnimatedButton (scale hover · shrink tap · ripple) ── */
export function AnimatedButton({
  children,
  className,
  variant = 'primary',
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([]);
  const variants: Record<string, string> = {
    primary: 'bg-aurora text-white shadow-glow',
    secondary: 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white',
    danger: 'bg-red-600 text-white',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 600);
    onClick?.(e);
  }
  return (
    <motion.button
      {...(rest as any)}
      onClick={handleClick}
      whileHover={reduce ? undefined : { scale: 1.05 }}
      whileTap={reduce ? undefined : tap}
      transition={transition.snappy}
      className={classNames(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {!reduce &&
        ripples.map((rp) => (
          <span
            key={rp.id}
            className="ripple-ink pointer-events-none absolute z-0 rounded-full bg-white/40"
            style={{ left: rp.x, top: rp.y }}
          />
        ))}
    </motion.button>
  );
}

/* ── AnimatedCard (lift on hover) ─────────────── */
export function AnimatedCard({
  children,
  className,
  onClick,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: DUR.slow, ease: EASE, delay }}
      whileHover={reduce ? undefined : hoverLift}
      className={classNames(
        'glass rounded-2xl p-5 transition-shadow duration-300 hover:shadow-glow',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/* ── MotionWrapper / PageTransition ───────────── */
export function MotionWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={pageVariants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>
  );
}

/** Wrap a Shell's <main> content to fade+slide between routes. */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── CountUp (animated counter) ───────────────── */
export function CountUp({
  to,
  from = 0,
  duration = 1.1,
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(reduce ? to : from);
  React.useEffect(() => {
    if (reduce) { setDisplay(to); return; }
    const controls = animate(from, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, reduce]);
  const text = format ? format(display) : `${prefix}${display.toFixed(decimals)}${suffix}`;
  return <span className={className}>{text}</span>;
}

/* ── CircularProgress (animated ring) ─────────── */
export function CircularProgress({
  value,
  size = 120,
  stroke = 10,
  color = 'rgb(99 102 241)',
  track = 'rgba(148,163,184,0.18)',
  label,
  sublabel,
  icon,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  icon?: string;
}) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - v / 100);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {icon && <span className="text-lg leading-none">{icon}</span>}
        {label != null && <span className="font-display text-xl font-bold text-slate-900">{label}</span>}
        {sublabel != null && <span className="text-[11px] font-medium text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ── FlipCard (hover on desktop · tap on mobile) ── */
export function FlipCard({
  front,
  back,
  className,
  height = 200,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  height?: number;
}) {
  const [flipped, setFlipped] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  // Hover is tracked on the stable, non-transforming wrapper — tracking it on
  // the rotating element makes the pointer fall in/out of the rotated geometry
  // and flickers. Flip when hovered (desktop) OR tapped (touch).
  return (
    <div
      className={classNames('[perspective:1200px]', className)}
      style={{ height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d] [will-change:transform]"
        animate={{ rotateY: hovered || flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">{front}</div>
        <div className="absolute inset-0 [transform:rotateY(180deg)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">{back}</div>
      </motion.div>
    </div>
  );
}

/* ── Timeline (vertical · pulse on current) ───── */
export interface TimelineStep {
  label: string;
  hint?: React.ReactNode;
  time?: React.ReactNode;
  icon?: string;
}
export function Timeline({ steps, current }: { steps: TimelineStep[]; current: number }) {
  return (
    <ol className="relative ml-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 overflow-hidden rounded-full bg-slate-200">
                <motion.span
                  className="block w-full bg-aurora"
                  initial={{ height: 0 }}
                  animate={{ height: done ? '100%' : '0%' }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
              </span>
            )}
            <span className="relative z-10">
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.1 : 1 }}
                className={classNames(
                  'grid h-8 w-8 place-items-center rounded-full text-sm font-bold ring-2 transition',
                  done
                    ? 'bg-aurora text-white ring-transparent'
                    : active
                      ? 'bg-white text-brand ring-brand'
                      : 'bg-white text-slate-400 ring-slate-200',
                )}
              >
                {done ? '✓' : s.icon ?? i + 1}
              </motion.span>
              {active && (
                <span className="absolute inset-0 -z-0 animate-pulse-ring rounded-full ring-2 ring-brand/50" />
              )}
            </span>
            <div className="pt-0.5">
              <p className={classNames('font-semibold', active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400')}>
                {s.label}
              </p>
              {s.hint && <p className="text-xs text-slate-500">{s.hint}</p>}
              {s.time && <p className="mt-0.5 text-[11px] text-slate-400">{s.time}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── SwipeToAccept (Uber-style drag confirm) ──── */
export function SwipeToAccept({
  label = 'Swipe to accept',
  confirmedLabel = 'Accepted',
  onAccept,
  disabled,
  accent = 'bg-aurora',
}: {
  label?: string;
  confirmedLabel?: string;
  onAccept: () => void;
  disabled?: boolean;
  accent?: string;
}) {
  const reduce = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxX, setMaxX] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const labelOpacity = useTransform(x, [0, Math.max(40, maxX * 0.6)], [1, 0]);
  const fillWidth = useTransform(x, (v) => `${v + 52}px`);

  React.useEffect(() => {
    function measure() {
      if (trackRef.current) setMaxX(trackRef.current.offsetWidth - 52);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (done) return;
    if (info.offset.x >= maxX * 0.75) {
      setDone(true);
      animate(x, maxX, { duration: 0.18 });
      onAccept();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 32 });
    }
  }

  // Reduced motion / no-drag fallback → simple button
  if (reduce) {
    return (
      <button
        onClick={() => !disabled && onAccept()}
        disabled={disabled}
        className={classNames('w-full rounded-full py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50', accent)}
      >
        ✓ {label}
      </button>
    );
  }

  return (
    <div
      ref={trackRef}
      className={classNames(
        'relative h-13 w-full select-none overflow-hidden rounded-full border border-slate-200 bg-slate-100',
        disabled && 'pointer-events-none opacity-50',
      )}
      style={{ height: 52 }}
    >
      <motion.div className={classNames('absolute inset-y-0 left-0 rounded-full', accent)} style={{ width: fillWidth }} />
      <motion.span style={{ opacity: labelOpacity }} className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-slate-500">
        {label} →
      </motion.span>
      <span className={classNames('pointer-events-none absolute inset-0 grid place-items-center text-sm font-bold text-white transition', done ? 'opacity-100' : 'opacity-0')}>
        {confirmedLabel} ✓
      </span>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={onDragEnd}
        className="absolute left-1 top-1 grid h-[44px] w-[44px] cursor-grab place-items-center rounded-full bg-white text-lg text-brand shadow-md active:cursor-grabbing"
      >
        {done ? '✓' : '→'}
      </motion.div>
    </div>
  );
}

/* ── Drawer (slide-in from right) ─────────────── */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 380,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="absolute right-0 top-0 flex h-full max-w-[90vw] flex-col bg-white/95 shadow-2xl backdrop-blur-xl"
              style={{ width }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={transition.soft}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}

/* ── Greeting (time-aware, relatable) ─────────── */
export function Greeting({ name, suffix }: { name?: string; suffix?: React.ReactNode }) {
  const [g, setG] = React.useState<{ text: string; emoji: string } | null>(null);
  React.useEffect(() => {
    const h = new Date().getHours();
    const pick =
      h < 5 ? { text: 'Still up', emoji: '🌙' }
      : h < 12 ? { text: 'Good morning', emoji: '☀️' }
      : h < 17 ? { text: 'Good afternoon', emoji: '🌤️' }
      : h < 21 ? { text: 'Good evening', emoji: '🌆' }
      : { text: 'Good night', emoji: '🌙' };
    setG(pick);
  }, []);
  const first = name?.split(' ')[0];
  return (
    <span className="inline-flex items-center gap-2">
      <motion.span
        key={g?.emoji}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={transition.soft}
      >
        {g?.emoji ?? '👋'}
      </motion.span>
      <span>
        {g?.text ?? 'Welcome'}{first ? `, ${first}` : ''}{suffix}
      </span>
    </span>
  );
}

/* ── AnimatedEmpty (Lottie-style looping SVG) ─── */
/* Self-contained animated illustrations — no remote JSON / heavy
   Lottie bundle, so they work offline and keep the bundle light. */
export function AnimatedEmpty({
  variant = 'box',
  title,
  hint,
  children,
}: {
  variant?: 'box' | 'search' | 'car';
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="mx-auto mb-5 w-40">
        <EmptyArt variant={variant} />
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}

function EmptyArt({ variant }: { variant: 'box' | 'search' | 'car' }) {
  const float = {
    animate: { y: [0, -8, 0] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
  };
  if (variant === 'search') {
    return (
      <motion.svg viewBox="0 0 120 120" className="w-full" {...float}>
        <circle cx="52" cy="52" r="30" fill="rgba(99,102,241,0.12)" />
        <motion.circle cx="52" cy="52" r="22" fill="none" stroke="rgb(99 102 241)" strokeWidth="5"
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity }} style={{ transformOrigin: '52px 52px' }} />
        <rect x="74" y="74" width="26" height="9" rx="4.5" transform="rotate(45 74 74)" fill="rgb(99 102 241)" />
      </motion.svg>
    );
  }
  if (variant === 'car') {
    return (
      <motion.svg viewBox="0 0 140 90" className="w-full" {...float}>
        <rect x="20" y="38" width="100" height="26" rx="10" fill="rgba(99,102,241,0.15)" />
        <path d="M34 38 L48 22 H92 L106 38 Z" fill="rgba(139,92,246,0.25)" />
        <motion.circle cx="46" cy="66" r="10" fill="rgb(99 102 241)" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '46px 66px' }} />
        <motion.circle cx="96" cy="66" r="10" fill="rgb(139 92 246)" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '96px 66px' }} />
      </motion.svg>
    );
  }
  return (
    <motion.svg viewBox="0 0 120 110" className="w-full" {...float}>
      <path d="M20 44 L60 26 L100 44 L60 62 Z" fill="rgba(139,92,246,0.25)" />
      <path d="M20 44 V80 L60 98 V62 Z" fill="rgba(99,102,241,0.18)" />
      <path d="M100 44 V80 L60 98 V62 Z" fill="rgba(99,102,241,0.30)" />
      <motion.circle cx="60" cy="20" r="5" fill="rgb(139 92 246)" animate={{ y: [0, 6, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
    </motion.svg>
  );
}

/* ── Confetti (delight on success) ────────────── */
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

/** Imperative burst — safe to call anywhere on the client. No-op for reduced motion. */
export function launchConfetti(count = 90) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(root);
  const W = window.innerWidth;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 8;
    const left = Math.random() * W;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.cssText = `position:absolute;top:-20px;left:${left}px;width:${size}px;height:${size * 0.6}px;background:${color};border-radius:2px;opacity:0.95`;
    root.appendChild(p);
    const xDrift = (Math.random() - 0.5) * 320;
    const rot = (Math.random() - 0.5) * 720;
    p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${xDrift}px, ${window.innerHeight + 60}px) rotate(${rot}deg)`, opacity: 1 },
        { opacity: 0 },
      ],
      { duration: 1800 + Math.random() * 1200, easing: 'cubic-bezier(0.22,1,0.36,1)', delay: Math.random() * 250 },
    );
  }
  setTimeout(() => root.remove(), 3600);
}

/* ── Skeleton loaders (shimmer) ───────────────── */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={classNames('shimmer rounded-lg', className)} />;
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="glass divide-y divide-slate-100 overflow-hidden rounded-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex gap-4 border-b border-slate-100 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-slate-50 p-4 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className={classNames('h-3.5 flex-1', c === 0 && 'max-w-[40%]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── TrendArrow (KPI deltas) ──────────────────── */
export function TrendArrow({ value, suffix = '' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={classNames('inline-flex items-center gap-0.5 text-xs font-semibold', up ? 'text-emerald-600' : 'text-red-500')}>
      <motion.span initial={{ y: up ? 4 : -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={transition.snappy}>
        {up ? '↑' : '↓'}
      </motion.span>
      {Math.abs(value)}{suffix}
    </span>
  );
}
