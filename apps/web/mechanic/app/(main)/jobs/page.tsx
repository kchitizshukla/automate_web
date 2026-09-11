'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Job } from '@automate/shared-types';
import { formatDateTime } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeJob } from '@/lib/normalize';
import { Loading, ErrorState, Empty, PageHeader, StatusBadge, Card } from '@/components/ui';
import { Breadcrumbs, Tabs, ConfirmDialog, FadeIn, notify, SwipeToAccept, AnimatedButton } from '@/components/kit';

const FILTERS: Record<string, (j: Job) => boolean> = {
  all: () => true,
  assigned: (j) => j.status === 'assigned',
  active: (j) => j.status === 'accepted' || j.status === 'in_progress',
  completed: (j) => j.status === 'completed',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [tab, setTab] = useState('all');
  const [pending, setPending] = useState<{ job: Job; kind: 'accept' | 'reject' } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // /jobs returns raw snake_case rows; normalizeJob maps them to the
      // camelCase shared-types shape this page renders.
      setJobs((await api.listJobs()).map((j) => normalizeJob(j as any)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function acceptJob(job: Job) {
    setActingId(job.id);
    try {
      await api.acceptJob(job.id);
      notify.success(`Job #${job.id} accepted ✓`);
      await load();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActingId(null);
    }
  }

  async function confirmAct() {
    if (!pending) return;
    const { job, kind } = pending;
    setActingId(job.id);
    try {
      if (kind === 'accept') await api.acceptJob(job.id);
      else await api.rejectJob(job.id);
      notify.success(`Job #${job.id} ${kind === 'accept' ? 'accepted ✓' : 'rejected'}`);
      await load();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActingId(null);
      setPending(null);
    }
  }

  const list = jobs ?? [];
  const counts = useMemo(() => ({
    all: list.length,
    assigned: list.filter(FILTERS.assigned).length,
    active: list.filter(FILTERS.active).length,
    completed: list.filter(FILTERS.completed).length,
  }), [list]);
  const filtered = list.filter(FILTERS[tab]);

  if (loading) return <Loading />;
  if (error && !jobs) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Bookings & Jobs' }]} />
      <PageHeader title="Bookings & Jobs" subtitle="Accept new requests and track work in progress." />

      <div className="mb-5 overflow-x-auto">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'all', label: 'All', icon: '📋', count: counts.all },
            { key: 'assigned', label: 'Requests', icon: '📥', count: counts.assigned },
            { key: 'active', label: 'Active', icon: '⚙️', count: counts.active },
            { key: 'completed', label: 'Completed', icon: '✅', count: counts.completed },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <Empty title="Nothing here yet" hint="Jobs matching this filter will appear here." icon="🔧" />
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => (
            <FadeIn key={job.id} delay={i * 0.04}>
              <Card hover className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">🔧</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">Job #{job.id}</p>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">Service #{job.serviceRequestId} · Updated {formatDateTime(job.updatedAt)}</p>
                      {job.notes && <p className="mt-1 truncate text-sm text-slate-600">{job.notes}</p>}
                    </div>
                  </div>
                </Link>
                {job.status === 'assigned' && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-[240px] sm:w-64">
                      <SwipeToAccept
                        label="Swipe to accept job"
                        confirmedLabel="Accepted"
                        disabled={actingId === job.id}
                        onAccept={() => acceptJob(job)}
                      />
                    </div>
                    <AnimatedButton variant="danger" onClick={() => setPending({ job, kind: 'reject' })} disabled={actingId === job.id}>
                      Reject
                    </AnimatedButton>
                  </div>
                )}
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        tone={pending?.kind === 'reject' ? 'danger' : 'primary'}
        title={pending?.kind === 'accept' ? 'Accept this job?' : 'Reject this job?'}
        message={pending ? `Job #${pending.job.id} will be ${pending.kind === 'accept' ? 'added to your active jobs' : 'returned to the dispatch queue'}.` : ''}
        confirmLabel={pending?.kind === 'accept' ? 'Accept job' : 'Reject job'}
        loading={actingId != null}
        onConfirm={confirmAct}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
