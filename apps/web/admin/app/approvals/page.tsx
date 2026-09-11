'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Card, Loading, ErrorState, Empty, PageHeader, Button, Avatar } from '@/components/ui';
import { Breadcrumbs, ConfirmDialog, FadeIn, notify } from '@/components/kit';
import type { MechanicRow } from '@/lib/rows';
import { approvalOf, isAvailable } from '@/lib/rows';

export default function ApprovalsPage() {
  const { data, loading, error, reload } = useApi(() => api.adminMechanics(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{ m: MechanicRow; approve: boolean } | null>(null);

  const rows = ((data as unknown as MechanicRow[]) ?? []).filter((m) => approvalOf(m) === 'pending');

  async function confirmAct() {
    if (!pendingAction) return;
    const { m, approve } = pendingAction;
    setBusyId(m.id);
    try {
      if (approve) await api.adminApproveMechanic(m.id);
      else await api.adminRejectMechanic(m.id);
      notify.success(`${(m.workshop_name as string) ?? m.name} ${approve ? 'approved ✓' : 'rejected'}`);
      reload();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
      setPendingAction(null);
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Approvals' }]} />
      <PageHeader title="Vendor Approvals" subtitle="Review and approve new workshop registrations" />
      {loading ? (
        <Loading label="Loading approval queue…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <Empty title="All caught up" hint="No vendors are awaiting approval." icon="✅" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((m, i) => (
            <FadeIn key={m.id} delay={i * 0.05}>
              <Card hover>
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-slate-900">{(m.workshop_name as string) ?? m.name}</p>
                    <p className="text-xs text-slate-500">{m.name} · {(m.location as string) ?? '—'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">{(m.specialization as string) ?? m.skills ?? '—'}</span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{isAvailable(m) ? 'Available' : 'Busy'}</span>
                  {m.email && <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{m.email as string}</span>}
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <Button onClick={() => setPendingAction({ m, approve: true })} disabled={busyId === m.id} className="flex-1">✓ Approve</Button>
                  <Button variant="danger" onClick={() => setPendingAction({ m, approve: false })} disabled={busyId === m.id} className="flex-1">Reject</Button>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        tone={pendingAction?.approve ? 'primary' : 'danger'}
        title={pendingAction?.approve ? 'Approve this vendor?' : 'Reject this vendor?'}
        message={pendingAction ? `${(pendingAction.m.workshop_name as string) ?? pendingAction.m.name} will be ${pendingAction.approve ? 'able to log in and accept jobs' : 'removed from the approval queue'}.` : ''}
        confirmLabel={pendingAction?.approve ? 'Approve' : 'Reject'}
        loading={busyId != null}
        onConfirm={confirmAct}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
