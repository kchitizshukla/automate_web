'use client';

import React, { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import {
  Loading,
  ErrorState,
  Empty,
  PageHeader,
  Select,
  StatusBadge,
  Button,
  TableWrap,
  Th,
  Td,
} from '@/components/ui';
import type { ServiceRow, MechanicRow } from '@/lib/rows';
import { srId, isAvailable } from '@/lib/rows';

const UNASSIGNED = new Set(['pending']);

export default function AssignPage() {
  const services = useApi(() => api.adminServices(), []);
  const mechanics = useApi(() => api.adminMechanics(), []);

  const [selected, setSelected] = useState<Record<number, number | ''>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ id: number; text: string; ok: boolean } | null>(
    null,
  );

  const loading = services.loading || mechanics.loading;
  const error = services.error || mechanics.error;

  const allServices = (services.data as unknown as ServiceRow[]) ?? [];
  const pending = useMemo(
    () => allServices.filter((s) => UNASSIGNED.has(s.status)),
    [allServices],
  );

  // Prefer available mechanics first in the dropdown.
  const mechList = useMemo(() => {
    const list = (mechanics.data as unknown as MechanicRow[]) ?? [];
    return [...list].sort(
      (a, b) => Number(isAvailable(b)) - Number(isAvailable(a)),
    );
  }, [mechanics.data]);

  async function assign(s: ServiceRow) {
    const id = srId(s);
    const mechanicId = selected[id];
    if (!mechanicId) {
      setMsg({ id, text: 'Pick a mechanic first.', ok: false });
      return;
    }
    setBusy(id);
    setMsg(null);
    try {
      await api.adminAssignJob(id, Number(mechanicId));
      setMsg({ id, text: 'Assigned successfully.', ok: true });
      services.reload();
    } catch (e) {
      setMsg({
        id,
        text: e instanceof Error ? e.message : 'Assignment failed',
        ok: false,
      });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading label="Loading assignments…" />;
  if (error) return <ErrorState message={error} onRetry={() => {
    services.reload();
    mechanics.reload();
  }} />;

  return (
    <div>
      <PageHeader
        title="Assign Jobs"
        subtitle={`${pending.length} pending request(s) awaiting assignment.`}
      />
      {pending.length === 0 ? (
        <Empty title="No pending service requests to assign." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Mechanic</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.map((s) => {
              const id = srId(s);
              return (
                <tr key={id} className="hover:bg-gray-50">
                  <Td className="font-medium text-gray-900">#{id}</Td>
                  <Td>{s.category ?? '—'}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td className="min-w-[200px]">
                    <Select
                      value={selected[id] ?? ''}
                      onChange={(v) =>
                        setSelected((m) => ({
                          ...m,
                          [id]: v !== '' ? Number(v) : '',
                        }))
                      }
                      placeholder={mechList.length ? 'Select mechanic…' : 'No mechanics'}
                      options={mechList.map((m) => ({
                        value: m.id,
                        label: m.name ?? `Mechanic #${m.id}`,
                        hint: isAvailable(m) ? 'available' : 'busy',
                      }))}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => assign(s)}
                        disabled={busy === id}
                        variant="primary"
                        className="text-xs px-3 py-1.5"
                      >
                        {busy === id ? 'Assigning…' : 'Assign'}
                      </Button>
                      {msg?.id === id && (
                        <span
                          className={`text-xs ${
                            msg.ok ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {msg.text}
                        </span>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
