'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { MechanicProfile, Review, Vehicle } from '@automate/shared-types';
import { vehicleIcon, vehicleOptionLabel } from '@automate/shared-utils';
import { formatCurrency, formatDate, classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeMechanic, normalizeReview, normalizeVehicle } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import { Card, ErrorState, Loading, Stars, Button, Field, inputClass } from '@/components/ui';

function Profile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', category: 'General Service', description: '', scheduledAt: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, v] = await Promise.all([api.getMechanicProfile(Number(id)), api.listVehicles()]);
      const raw = p as any;
      setProfile({ ...normalizeMechanic(raw), reviews: (raw.reviews ?? []).map(normalizeReview) });
      setReviews((raw.reviews ?? []).map(normalizeReview));
      setVehicles(v.map(normalizeVehicle));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) { setMsg('Please select a vehicle'); return; }
    setBooking(true); setMsg('');
    try {
      const svc: any = await api.bookService({
        vehicleId: Number(form.vehicleId),
        category: form.category,
        description: form.description || `${form.category} requested`,
        scheduledAt: form.scheduledAt || undefined,
        mechanicId: Number(id),
      });
      router.push(`/services/${svc.id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Booking failed');
      setBooking(false);
    }
  }

  if (loading) return <Loading label="Loading workshop…" />;
  if (error || !profile) return <ErrorState message={error || 'Not found'} onRetry={load} />;

  return (
    <>
      <Link href="/discover" className="mb-4 inline-flex text-sm font-medium text-slate-500 hover:text-slate-800">← Back to discovery</Link>

      {/* Vendor header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-slate-900 p-7 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(30rem 30rem at 110% -20%, rgba(139,92,246,0.4), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-2xl font-bold ring-1 ring-white/20">
              {profile.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold">{profile.workshopName ?? profile.name}</h1>
              <p className="text-sm text-slate-300">{profile.name} · {profile.location ?? '—'}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Stars value={profile.rating} />
                <span className="text-sm font-semibold">{profile.rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({profile.reviewsCount ?? reviews.length} reviews)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Starting from</p>
            <p className="font-display text-2xl font-bold text-gradient">{profile.priceFrom != null ? formatCurrency(profile.priceFrom) : '—'}</p>
            <span className={classNames('mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', profile.available ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-slate-300')}>
              {profile.available ? '● Available now' : 'Currently busy'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Reviews + specialization */}
        <div className="lg:col-span-3">
          <Card className="mb-5">
            <h3 className="font-display font-bold text-slate-900">Specialization</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.specialization ?? profile.skills).split(',').map((s) => (
                <span key={s} className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{s.trim()}</span>
              ))}
            </div>
          </Card>

          <h3 className="mb-3 font-display text-lg font-bold text-slate-900">Client reviews</h3>
          {reviews.length === 0 ? (
            <Card><p className="text-sm text-slate-500">No reviews yet — be the first to book!</p></Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{r.userName ?? 'Customer'}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-slate-600">“{r.comment}”</p>}
                  <p className="mt-2 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Booking panel */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <h3 className="font-display font-bold text-slate-900">Book this workshop</h3>
            <form onSubmit={book} className="mt-4 space-y-4">
              <Field label="Vehicle">
                <select className={inputClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select a vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {vehicleIcon(v)} {vehicleOptionLabel(v)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Service type">
                <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {['General Service', 'Brake Repair', 'AC Repair', 'Tyre Replacement', 'Engine Diagnostics', 'Wash & Detailing'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="When">
                <input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </Field>
              <Field label="Describe the issue">
                <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. brakes squeaking at low speed" />
              </Field>
              {msg && <p className="text-sm text-red-600">{msg}</p>}
              {vehicles.length === 0 && <p className="text-xs text-amber-600">Add a vehicle in My Garage first.</p>}
              <Button type="submit" disabled={booking} className="w-full">{booking ? 'Booking…' : 'Confirm booking →'}</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Profile />
    </Protected>
  );
}
