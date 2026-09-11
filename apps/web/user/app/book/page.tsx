'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { Vehicle } from '@automate/shared-types';
import { vehicleDisplayName, vehicleIcon, vehicleOptionLabel } from '@automate/shared-utils';
import { classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeVehicle } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import { Card, Empty, ErrorState, Loading, Select, inputClass } from '@/components/ui';
import { Breadcrumbs, Stepper, Chip, DatePicker, FloatingInput, notify, launchConfetti } from '@/components/kit';
import { SERVICE_CATEGORIES } from '@/lib/catalog';

const STEPS = ['Service', 'Schedule', 'Address', 'Confirm'];
const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];

function Book() {
  const router = useRouter();
  const params = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehicleId: '',
    category: params.get('category') || SERVICE_CATEGORIES[0].key,
    description: '',
    date: '',
    slot: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const v = (await api.listVehicles()).map(normalizeVehicle);
      setVehicles(v);
      if (v.length) setForm((f) => ({ ...f, vehicleId: String(v[0].id) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === form.vehicleId);
  const selectedCat = SERVICE_CATEGORIES.find((c) => c.key === form.category);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.vehicleId && !!form.category && form.description.trim().length >= 5;
    if (step === 1) return !!form.date && !!form.slot;
    if (step === 2) return form.address.trim().length >= 4 && form.city.trim().length >= 2 && /^\d{6}$/.test(form.pincode) && /^\d{10}$/.test(form.phone);
    return true;
  }, [step, form]);

  function next() {
    if (!canNext) { notify.error('Please complete this step first'); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  async function submit() {
    setSubmitting(true);
    const scheduledAt = form.date && form.slot
      ? new Date(`${form.date.slice(0, 10)}T${form.slot}:00`).toISOString()
      : undefined;
    const description = `${form.description}\n\nService address: ${form.address}, ${form.city} - ${form.pincode}\nContact: ${form.phone}`;
    try {
      const created = await api.bookService({
        vehicleId: Number(form.vehicleId),
        category: form.category,
        description,
        scheduledAt,
      });
      launchConfetti();
      notify.success('Booking confirmed! 🎉');
      router.push(`/services/${created.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Booking failed');
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (vehicles.length === 0) {
    return (
      <>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Book Service' }]} />
        <Empty title="No vehicles found" hint="Add a vehicle before booking a service." icon="🚙">
          <Link href="/vehicles" className="rounded-xl bg-aurora px-4 py-2.5 text-sm font-semibold text-white shadow-glow">Add a vehicle →</Link>
        </Empty>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Book Service' }]} />
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Book a service</h1>
        <p className="mt-1.5 text-sm text-slate-500">Four quick steps — schedule a doorstep service for any vehicle in your garage.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-8">
            <Stepper steps={STEPS} current={step} />
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500">
                  {step === STEPS.length - 1 ? "You're all set — confirm to finish! 🎉" : `You're ${Math.round((step / (STEPS.length - 1)) * 100)}% done`}
                </span>
                <span className="text-brand">{Math.round((step / (STEPS.length - 1)) * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-aurora"
                  initial={false}
                  animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Vehicle</label>
                    <Select
                      value={form.vehicleId}
                      onChange={(v) => setForm({ ...form, vehicleId: String(v) })}
                      placeholder="Select your vehicle…"
                      searchable={vehicles.length > 6}
                      options={vehicles.map((v) => ({
                        value: v.id,
                        label: vehicleOptionLabel(v),
                        icon: vehicleIcon(v),
                        hint: v.vehicleCategoryName ?? undefined,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Service category</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_CATEGORIES.map((c) => (
                        <Chip key={c.key} active={form.category === c.key} onClick={() => setForm({ ...form, category: c.key })}>
                          {c.icon} {c.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Describe the issue</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Brakes squeaking when stopping, due for periodic service…"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Preferred date</label>
                    <DatePicker value={form.date} min={new Date()} onChange={(iso) => setForm({ ...form, date: iso })} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Preferred time slot</label>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map((t) => (
                        <Chip key={t} active={form.slot === t} onClick={() => setForm({ ...form, slot: t })}>{t}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FloatingInput label="Service address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <FloatingInput label="Pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
                  </div>
                  <FloatingInput label="Contact number" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                  <p className="text-xs text-slate-400">We&apos;ll send pickup updates to this number.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Review your booking</p>
                  {[
                    ['Service', `${selectedCat?.icon ?? ''} ${selectedCat?.label ?? form.category}`],
                    ['Vehicle', selectedVehicle ? vehicleOptionLabel(selectedVehicle) : '—'],
                    ['Schedule', form.date ? `${new Date(form.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${form.slot}` : '—'],
                    ['Address', `${form.address}, ${form.city} - ${form.pincode}`],
                    ['Contact', form.phone],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                      <span className="font-medium text-slate-500">{k}</span>
                      <span className="text-right font-semibold text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-medium text-slate-500">Notes: </span>{form.description}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={back} disabled={step === 0} className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-40">
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className={classNames('rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition', canNext ? 'bg-aurora shadow-glow hover:brightness-110' : 'bg-slate-300')}>
                Continue →
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="rounded-xl bg-aurora px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60">
                {submitting ? 'Confirming…' : 'Confirm booking 🎉'}
              </button>
            )}
          </div>
        </Card>

        {/* Live summary aside */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Booking summary</p>
            <div className={classNames('mt-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl text-white shadow-md', selectedCat?.gradient ?? 'from-indigo-500 to-violet-500')}>
              {selectedCat?.icon ?? '🛠'}
            </div>
            <p className="mt-3 font-display text-lg font-bold text-slate-900">{selectedCat?.label ?? form.category}</p>
            <p className="text-sm text-slate-500">
              {selectedVehicle
                ? `${vehicleIcon(selectedVehicle)} ${vehicleDisplayName(selectedVehicle)}`
                : 'Select a vehicle'}
            </p>
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-700">{form.date ? new Date(form.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Time</dt><dd className="font-medium text-slate-700">{form.slot || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">City</dt><dd className="font-medium text-slate-700">{form.city || '—'}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ Free cancellation up to 2 hours before</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Suspense fallback={<Loading />}>
        <Book />
      </Suspense>
    </Protected>
  );
}
