'use client';

// My Garage — any vehicle, not just cars. The taxonomy behind the add/edit
// form is entirely API-driven (see components/VehicleForm.tsx).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Vehicle } from '@automate/shared-types';
import {
  formatDate,
  vehicleDisplayName,
  vehicleIcon,
  vehicleSubtitle,
} from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeVehicle } from '@/lib/normalize';
import { notify } from '@/components/kit';
import { Protected } from '@/components/Protected';
import { VehicleForm } from '@/components/VehicleForm';
import { Button, Card, Empty, ErrorState, Loading, PageHeader } from '@/components/ui';

function VehicleCard({
  v,
  onEdit,
  onDelete,
  deleting,
}: {
  v: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const subtitle = vehicleSubtitle(v);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl"
        >
          {vehicleIcon(v)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{vehicleDisplayName(v)}</p>
          {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
          {v.nickname && <p className="truncate text-xs text-slate-400">“{v.nickname}”</p>}
        </div>
        {v.isElectric && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            ⚡ Electric
          </span>
        )}
      </div>

      <p className="mt-3 inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-sm tracking-wider">
        {v.registrationNo}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">Added {formatDate(v.createdAt)}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit} className="!px-3 !py-1.5 !text-xs">
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            disabled={deleting}
            className="!px-3 !py-1.5 !text-xs"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles((await api.listVehicles()).map(normalizeVehicle));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (payload: Record<string, unknown>) => {
      const created = normalizeVehicle(await api.addVehicle(payload as never));
      notify.success(`${vehicleDisplayName(created)} added to your garage`);
      setAdding(false);
      await load();
    },
    [load],
  );

  const save = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!editing) return;
      const updated = normalizeVehicle(await api.updateVehicle(editing.id, payload as never));
      notify.success(`${vehicleDisplayName(updated)} updated`);
      setEditing(null);
      await load();
    },
    [editing, load],
  );

  const remove = useCallback(
    async (v: Vehicle) => {
      const label = vehicleDisplayName(v);
      if (!window.confirm(`Remove ${label} (${v.registrationNo}) from your garage?`)) return;
      setDeletingId(v.id);
      try {
        const res = await api.deleteVehicle(v.id);
        notify.success(res.message ?? `${label} removed`);
        await load();
      } catch (err) {
        notify.error(err instanceof Error ? err.message : 'Could not remove the vehicle');
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  // A quick sense of the garage without hardcoding what a vehicle can be.
  const summary = useMemo(() => {
    const categories = new Set(vehicles.map((v) => v.vehicleCategoryName).filter(Boolean));
    const electric = vehicles.filter((v) => v.isElectric).length;
    return { categories: categories.size, electric };
  }, [vehicles]);

  return (
    <>
      <PageHeader
        title="My Garage"
        subtitle="Cars, bikes, trucks, tractors — every vehicle you own"
        action={
          !adding && !editing ? (
            <Button onClick={() => setAdding(true)}>Add a vehicle</Button>
          ) : undefined
        }
      />

      {(adding || editing) && (
        <Card className="mb-6">
          <h2 className="mb-4 text-base font-semibold">
            {editing ? `Edit ${vehicleDisplayName(editing)}` : 'Add a vehicle'}
          </h2>
          <VehicleForm
            key={editing?.id ?? 'new'}
            vehicle={editing}
            onSubmit={editing ? save : add}
            onCancel={() => {
              setAdding(false);
              setEditing(null);
            }}
          />
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : vehicles.length === 0 ? (
        <Empty
          title="Your garage is empty"
          hint="Add your first vehicle — a car, bike, scooter, truck, tractor or anything else."
          icon="🚙"
        >
          {!adding && <Button onClick={() => setAdding(true)}>Add a vehicle</Button>}
        </Empty>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
            {summary.categories > 1 && ` across ${summary.categories} categories`}
            {summary.electric > 0 && ` · ${summary.electric} electric`}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                v={v}
                onEdit={() => {
                  setAdding(false);
                  setEditing(v);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={() => remove(v)}
                deleting={deletingId === v.id}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Vehicles />
    </Protected>
  );
}
