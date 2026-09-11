'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ServiceRequest, Vehicle, Payment, Mechanic } from '@automate/shared-types';
import { formatCurrency, formatDate, classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { vehicleDisplayName, vehicleIcon } from '@automate/shared-utils';
import { normalizePayment, normalizeService, normalizeVehicle, normalizeMechanic } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import { useAuth } from '@/app/providers';
import { Card, Empty, ErrorState, SkeletonCards, StatCard, StatusBadge, Stars, Select } from '@/components/ui';
import { FadeIn, Stagger, StaggerItem, Carousel, CountUp, FlipCard, Greeting, CircularProgress } from '@/components/kit';
import { SERVICE_CATEGORIES, OFFERS, IMG } from '@/lib/catalog';

const ACTIVE: ServiceRequest['status'][] = ['pending', 'assigned', 'accepted', 'in_progress'];

function HeroSearch({ name }: { name?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/discover${params.toString() ? `?${params}` : ''}`);
  }

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-soft">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url('${IMG.hero}')` }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(110deg, rgba(15,23,42,0.95) 30%, rgba(79,70,229,0.55) 75%, rgba(14,165,233,0.45))' }}
      />
      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <FadeIn>
          <p className="text-sm font-medium text-indigo-200"><Greeting name={name} /></p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Vehicle trouble? Get it <span className="text-gradient">fixed today</span> by trusted experts.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-slate-300">
            Doorstep pickup, transparent pricing and real-time tracking — book a service in under a minute.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form onSubmit={search} className="mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-xl backdrop-blur sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 px-2">
              <span className="text-slate-400">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search mechanics, workshops, city…"
                className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="sm:w-52">
              <Select
                value={cat}
                onChange={(v) => { setCat(String(v)); router.push(`/book?category=${encodeURIComponent(String(v))}`); }}
                placeholder="Select a service…"
                options={SERVICE_CATEGORIES.map((c) => ({ value: c.key, label: `${c.icon}  ${c.label}` }))}
              />
            </div>
            <button type="submit" className="rounded-xl bg-aurora px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
              Search
            </button>
          </form>
        </FadeIn>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-300">
          <span>✓ 100+ verified workshops</span>
          <span>✓ 90-day service warranty</span>
          <span>✓ Live repair tracking</span>
        </div>
      </div>
    </div>
  );
}

function Categories() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">What does your vehicle need?</h2>
        <Link href="/book" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
      </div>
      <p className="-mt-2 mb-4 text-xs text-slate-400">Hover or tap a card to see details &amp; pricing.</p>
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SERVICE_CATEGORIES.map((c) => (
          <StaggerItem key={c.key}>
            <FlipCard
              height={168}
              front={
                <div className="grid h-full place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white/80 p-4 text-center shadow-soft">
                  <div>
                    <div className={classNames('mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-md', c.gradient)}>
                      {c.icon}
                    </div>
                    <p className="mt-3 font-display text-sm font-bold text-slate-900">{c.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Tap for details</p>
                  </div>
                </div>
              }
              back={
                <div className={classNames('flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-glow', c.gradient)}>
                  <div>
                    <p className="font-display text-sm font-bold">{c.label}</p>
                    <p className="mt-1 text-xs text-white/90">{c.blurb}</p>
                  </div>
                  <Link
                    href={`/book?category=${encodeURIComponent(c.key)}`}
                    className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
                  >
                    Book now →
                  </Link>
                </div>
              }
            />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function Offers() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">Offers &amp; discounts</h2>
        <span className="text-xs font-medium text-slate-400">Limited time</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o, i) => (
          <FadeIn key={o.code} delay={i * 0.08}>
            <div className={classNames('relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-soft', o.gradient)}>
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
              <div className="relative">
                <span className="text-3xl">{o.icon}</span>
                <p className="mt-2 font-display text-xl font-extrabold">{o.title}</p>
                <p className="mt-1 text-sm text-white/85">{o.desc}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-white/50 bg-white/10 px-3 py-1.5 text-sm font-bold tracking-wider">
                  <span>🏷️</span> {o.code}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function PopularWorkshops({ mechanics }: { mechanics: Mechanic[] }) {
  if (!mechanics.length) return null;
  const top = [...mechanics].sort((a, b) => b.rating - a.rating).slice(0, 8);
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">Top-rated workshops near you</h2>
        <Link href="/discover" className="text-sm font-semibold text-brand hover:underline">Explore all →</Link>
      </div>
      <Carousel>
        {top.map((m) => (
          <Link key={m.id} href={`/discover/${m.id}`} className="w-64 shrink-0 snap-start">
            <Card hover className="h-full">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-aurora text-lg font-bold text-white shadow-glow">
                  {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-slate-900">{m.workshopName ?? m.name}</p>
                  <p className="truncate text-xs text-slate-500">{m.location ?? '—'}</p>
                </div>
              </div>
              <p className="mt-3 inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{m.specialization ?? m.skills}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1"><Stars value={m.rating} /><span className="text-sm font-semibold text-slate-700">{m.rating.toFixed(1)}</span></span>
                <span className="text-sm font-semibold text-slate-700">from <span className="text-gradient">{m.priceFrom != null ? formatCurrency(m.priceFrom) : '—'}</span></span>
              </div>
            </Card>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Days since this vehicle's most recent completed service (null = never). */
function daysSinceService(vehicleId: number | string, services: ServiceRequest[]): number | null {
  const done = services
    .filter((s) => s.status === 'completed' && String((s as any).vehicleId ?? '') === String(vehicleId))
    .map((s) => new Date(s.createdAt).getTime())
    .sort((a, b) => b - a);
  if (!done.length) return null;
  return Math.floor((Date.now() - done[0]) / 86_400_000);
}

/* ── Car Health dashboard (animated rings) ────── */
function CarHealth({ vehicles, services }: { vehicles: Vehicle[]; services: ServiceRequest[] }) {
  const [activeId, setActiveId] = useState<string>('');
  const vehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === activeId) ?? vehicles[0],
    [vehicles, activeId],
  );
  const health = useMemo(() => {
    if (!vehicle) return null;
    const seed = Number(vehicle.id) || 1;
    const days = daysSinceService(vehicle.id, services);
    const base = days == null ? 72 : clamp(96 - days * 0.32, 46, 98);
    return {
      engine: clamp(base + ((seed * 7) % 10) - 4, 42, 99),
      battery: clamp(base + ((seed * 13) % 14) - 7, 38, 99),
      oil: clamp(base - ((seed * 5) % 20), 30, 99),
      days,
    };
  }, [vehicle, services]);

  if (!vehicle || !health) return null;
  const ringColor = (v: number) => (v >= 70 ? 'rgb(16 185 129)' : v >= 50 ? 'rgb(245 158 11)' : 'rgb(239 68 68)');
  const metrics = [
    { key: 'engine', label: 'Engine', icon: '🔧', value: health.engine },
    { key: 'battery', label: 'Battery', icon: '🔋', value: health.battery },
    { key: 'oil', label: 'Oil life', icon: '🛢️', value: health.oil },
  ];

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-900">Vehicle health</h2>
        {vehicles.length > 1 && (
          <Select
            className="w-56"
            value={String(vehicle.id)}
            onChange={(v) => setActiveId(String(v))}
            searchable={vehicles.length > 6}
            options={vehicles.map((v) => ({
              value: v.id,
              label: vehicleDisplayName(v),
              icon: vehicleIcon(v),
            }))}
          />
        )}
      </div>
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-around">
          {metrics.map((m) => (
            <div key={m.key} className="flex flex-col items-center">
              <CircularProgress
                value={m.value}
                color={ringColor(m.value)}
                icon={m.icon}
                label={`${m.value}%`}
                sublabel={m.label}
              />
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">
          {health.days == null
            ? `No service history yet for your ${vehicleDisplayName(vehicle)} — book a health check to get started.`
            : `Last serviced ${health.days} day${health.days === 1 ? '' : 's'} ago · estimates based on your service history.`}
        </p>
      </Card>
    </section>
  );
}

/* ── Smart suggestion (relatable nudge) ───────── */
function SmartSuggestion({ vehicles, services }: { vehicles: Vehicle[]; services: ServiceRequest[] }) {
  const suggestion = useMemo(() => {
    if (!vehicles.length) return null;
    const v = vehicles[0];
    const days = daysSinceService(v.id, services);
    const name = vehicleDisplayName(v);
    if (days == null) return { name, msg: `Your ${name} hasn't been serviced with us yet — a periodic check keeps it running smooth.`, cta: 'Book a checkup' };
    if (days >= 150) return { name, msg: `It's been ${days} days since your ${name}'s last service. It might be due soon. 🛠`, cta: 'Schedule service' };
    if (days >= 90) return { name, msg: `Your ${name} is approaching its service window — plan ahead and skip the queue.`, cta: 'Plan a service' };
    return null;
  }, [vehicles, services]);

  if (!suggestion) return null;
  return (
    <FadeIn>
      <div className="mb-8 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Smart suggestion</p>
            <p className="text-sm text-amber-800/90">{suggestion.msg}</p>
          </div>
        </div>
        <Link href="/book" className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
          {suggestion.cta} →
        </Link>
      </div>
    </FadeIn>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [v, s, p, m] = await Promise.all([
        api.listVehicles(),
        api.listServiceRequests(),
        api.listPayments(),
        api.discoverMechanics().catch(() => []),
      ]);
      setVehicles(v.map(normalizeVehicle));
      setServices(s.map(normalizeService));
      setPayments(p.map(normalizePayment));
      setMechanics((m as any[]).map(normalizeMechanic));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = useMemo(() => services.filter((s) => ACTIVE.includes(s.status)).length, [services]);
  const totalSpent = useMemo(() => payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0), [payments]);
  const completed = useMemo(() => services.filter((s) => s.status === 'completed').length, [services]);
  const recent = services.slice(0, 5);

  return (
    <>
      <HeroSearch name={user?.name} />
      <Categories />

      {loading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <SmartSuggestion vehicles={vehicles} services={services} />

          <section className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold text-slate-900">Your garage at a glance</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="In garage" value={<CountUp to={vehicles.length} />} icon="🚗" accent="indigo" trend="Registered vehicles" />
              <StatCard label="Active" value={<CountUp to={activeCount} />} icon="⚙️" accent="violet" trend="Ongoing services" />
              <StatCard label="Completed" value={<CountUp to={completed} />} icon="✅" accent="emerald" trend="Lifetime repairs" />
              <StatCard label="Total spent" value={<CountUp to={totalSpent} format={formatCurrency} />} icon="💳" accent="sky" trend="Across all bookings" />
            </div>
          </section>

          {vehicles.length > 0 && <CarHealth vehicles={vehicles} services={services} />}

          <PopularWorkshops mechanics={mechanics} />
          <Offers />

          <section className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">Recent activity</h2>
              <Link href="/services" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
            </div>
            {recent.length === 0 ? (
              <Empty title="No services yet" hint="Book your first service to get started." icon="🛠">
                <Link href="/discover" className="rounded-xl bg-aurora px-4 py-2.5 text-sm font-semibold text-white shadow-glow">Find a mechanic →</Link>
              </Empty>
            ) : (
              <Card className="divide-y divide-slate-100 p-0">
                {recent.map((s) => (
                  <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-lg">🔧</span>
                      <div>
                        <p className="font-semibold text-slate-800">{s.category}</p>
                        <p className="text-xs text-slate-500">{(s as any).bookingRef ?? formatDate(s.createdAt)} · {formatDate(s.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}
