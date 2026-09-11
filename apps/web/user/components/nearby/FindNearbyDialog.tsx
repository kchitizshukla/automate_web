'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { GeoLocation, NearbyRequest, PricingEstimate, Vehicle, VehicleIssue } from '@automate/shared-types';
import {
  VEHICLE_ISSUES,
  getEstimatedPrice,
  searchIssues,
  classNames,
  vehicleDisplayName,
  vehicleIcon,
  vehicleOptionLabel,
} from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeVehicle } from '@/lib/normalize';
import { requestLocation, describeLocation, type LocationResult } from '@/lib/nearby/location';
import { Modal, notify } from '@/components/kit';
import { Button, inputClass } from '@/components/ui';
import { EASE } from '@/lib/motion';

/* ── Issue picker ────────────────────────────── */

function IssuePicker({
  value,
  onChange,
}: {
  value: VehicleIssue | null;
  onChange: (i: VehicleIssue) => void;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchIssues(q), [q]);
  const unknown = VEHICLE_ISSUES.find((i) => i.requiresDiagnosis)!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={classNames(
          inputClass,
          'flex items-center justify-between gap-2 text-left',
          !value && 'text-slate-400',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {value ? (
            <>
              <span aria-hidden>{value.icon}</span>
              <span className="truncate text-slate-900">{value.label}</span>
            </>
          ) : (
            'Select the problem…'
          )}
        </span>
        <span aria-hidden className="text-slate-400">{open ? '▴' : '▾'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 p-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search: battery, puncture, overheating…"
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  No match — pick “{unknown.label}” and we will diagnose it on site.
                </p>
              ) : (
                results.map((i) => (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => {
                      onChange(i);
                      setOpen(false);
                      setQ('');
                    }}
                    className={classNames(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50',
                      value?.key === i.key && 'bg-indigo-50',
                    )}
                  >
                    <span aria-hidden className="mt-0.5 text-lg">{i.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">{i.label}</span>
                      <span className="block truncate text-xs text-slate-500">{i.hint}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Dialog ──────────────────────────────────── */

export function FindNearbyDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (r: NearbyRequest) => void;
}) {
  const reduce = useReducedMotion();
  const unknownIssue = VEHICLE_ISSUES.find((i) => i.requiresDiagnosis)!;

  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [issue, setIssue] = useState<VehicleIssue | null>(null);
  const [description, setDescription] = useState('');
  const [loc, setLoc] = useState<LocationResult | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const dontKnow = issue?.key === unknownIssue.key;

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      setLoc(await requestLocation());
    } finally {
      setLocating(false);
    }
  }, []);

  // Load the garage and take a location fix as the dialog opens, so the
  // primary CTA is never blocked on a permission prompt.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadError(null);
    void locate();
    api
      .listVehicles()
      .then((rows) => {
        const list = rows.map(normalizeVehicle);
        setVehicles(list);
        setVehicleId((prev) => prev ?? list[0]?.id ?? null);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load your vehicles'));
  }, [open, locate]);

  const vehicle = vehicles?.find((v) => v.id === vehicleId) ?? null;

  // Priced on the client for instant feedback; the backend recomputes with the
  // same function when the request is actually created.
  const estimate: PricingEstimate | null = useMemo(
    () => (issue ? getEstimatedPrice({ issueKey: issue.key, vehicleYear: vehicle?.year ?? null }) : null),
    [issue, vehicle?.year],
  );

  const canSubmit =
    !!issue && !!vehicleId && !!loc && !submitting && (dontKnow || issue.key !== 'other' || !!description.trim());

  async function submit() {
    if (!issue || !vehicleId || !loc) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createNearbyRequest({
        vehicleId,
        issueKey: issue.key,
        description: description.trim() || null,
        userLocation: loc.location as GeoLocation,
        locationSource: loc.source,
      });
      onCreated(created);
      // Reset so a second request starts clean.
      setIssue(null);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the request');
    } finally {
      setSubmitting(false);
    }
  }

  const noVehicles = vehicles !== null && vehicles.length === 0;

  return (
    <Modal open={open} onClose={submitting ? () => undefined : onClose} title="Find a mechanic nearby" size="md">
      <div className="space-y-4">
        {/* Vehicle — read from the existing garage, never re-entered. */}
        <section>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Your vehicle</label>
          {loadError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{loadError}</p>
          ) : noVehicles ? (
            <div className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
              You have no vehicles in your garage yet.{' '}
              <a href="/vehicles" className="font-semibold underline">Add one first →</a>
            </div>
          ) : vehicles === null ? (
            <div className="h-[62px] animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <div className="space-y-2">
              {vehicles.length > 1 && (
                <select
                  value={vehicleId ?? ''}
                  onChange={(e) => setVehicleId(Number(e.target.value))}
                  className={inputClass}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {vehicleOptionLabel(v)}
                    </option>
                  ))}
                </select>
              )}
              {vehicle && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <span aria-hidden className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg shadow-sm">
                    {vehicleIcon(vehicle)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {vehicleDisplayName(vehicle)} {vehicle.year ? `· ${vehicle.year}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">{vehicle.registrationNo ?? 'Registration not on file'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Issue */}
        <section>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">What is wrong?</label>
          <IssuePicker value={issue} onChange={setIssue} />
          <button
            type="button"
            onClick={() => setIssue(dontKnow ? null : unknownIssue)}
            className={classNames(
              'mt-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition',
              dontKnow
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                : 'border-dashed border-slate-300 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50',
            )}
          >
            <span aria-hidden>{dontKnow ? '✅' : '❓'}</span>
            <span className="font-medium">I don&apos;t know what the issue is</span>
            {dontKnow && <span className="ml-auto text-xs font-semibold">Diagnosis on site</span>}
          </button>
        </section>

        {/* Description */}
        <section>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Describe the issue{' '}
            <span className="font-normal text-slate-400">{dontKnow ? '(optional)' : issue?.key === 'other' ? '(required)' : '(recommended)'}</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, any sounds, warning lights, symptoms, or anything else you noticed…"
            className={classNames(inputClass, 'resize-none')}
          />
        </section>

        {/* Location */}
        <section className="rounded-xl border border-slate-200 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden>{locating ? '🛰️' : loc?.source === 'gps' ? '📍' : '📌'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {locating ? 'Getting your location…' : describeLocation(loc?.location)}
              </p>
              {loc?.message && <p className="mt-0.5 text-xs text-amber-700">{loc.message}</p>}
              {loc?.source === 'gps' && <p className="mt-0.5 text-xs text-green-700">GPS location confirmed</p>}
            </div>
            {!locating && loc?.source !== 'gps' && (
              <button type="button" onClick={() => void locate()} className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline">
                Retry
              </button>
            )}
          </div>
        </section>

        {/* Estimate. Deliberately NOT wrapped in AnimatePresence: the price must
            render the moment the issue changes, never waiting on an exit
            animation to finish. The key still re-runs the enter transition. */}
        <div>
          {estimate && (
            <motion.section
              key={issue?.key}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Estimated cost</p>
              <p className="mt-0.5 font-display text-2xl font-extrabold text-slate-900">{estimate.display}</p>
              <p className="mt-1 text-xs text-slate-600">{estimate.note}</p>
              {estimate.additionalCharges.length > 0 && (
                <ul className="mt-2 space-y-0.5 border-t border-indigo-100 pt-2">
                  {estimate.additionalCharges.map((c) => (
                    <li key={c.label} className="flex justify-between text-xs text-slate-600">
                      <span>{c.label}</span>
                      <span className="font-medium">₹{c.amount.toLocaleString('en-IN')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting} className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!canSubmit} className="sm:w-auto">
            {submitting ? 'Requesting…' : 'Find a Mechanic'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
