'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import type { Job, JobUpdate } from '@automate/shared-types';
import { formatDateTime } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { API_ORIGIN } from '@/lib/config';
import { Loading, ErrorState, Empty, StatusBadge, Card, Button, Select, inputClass } from '@/components/ui';
import { Breadcrumbs, Stepper, Timeline, notify } from '@/components/kit';

const STATUS_OPTIONS = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PROGRESS_STEPS = ['Assigned', 'Accepted', 'In progress', 'Completed'];
const STEP_INDEX: Record<string, number> = { pending: 0, assigned: 0, accepted: 1, in_progress: 2, completed: 3 };

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [updates, setUpdates] = useState<JobUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('in_progress');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imageMessage, setImageMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reschedAt, setReschedAt] = useState('');
  const [reschedBusy, setReschedBusy] = useState(false);
  const [reschedMsg, setReschedMsg] = useState('');

  const loadJob = useCallback(async () => {
    setError(null);
    try {
      const j = await api.listJobs();
      const found = j.find((x) => x.id === jobId) ?? null;
      setJob(found);
      if (found && STATUS_OPTIONS.some((o) => o.value === found.status)) {
        setStatus(found.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const loadUpdates = useCallback(async () => {
    try {
      setUpdates(await api.listJobUpdates(jobId));
    } catch {
      // keep last successful poll
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
    loadUpdates();
  }, [loadJob, loadUpdates]);

  useEffect(() => {
    const t = setInterval(loadUpdates, 5000);
    return () => clearInterval(t);
  }, [loadUpdates]);

  async function submitStatus(e: FormEvent) {
    e.preventDefault();
    setSavingStatus(true);
    setActionMsg(null);
    setError(null);
    try {
      await api.updateJobStatus(jobId, status, notes || undefined);
      setNotes('');
      setActionMsg('Status updated successfully.');
      notify.success(`Status updated to "${status.replace('_', ' ')}"`);
      await Promise.all([loadJob(), loadUpdates()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      notify.error('Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitReschedule(e: FormEvent) {
    e.preventDefault();
    if (!reschedAt) return;
    setReschedBusy(true);
    setReschedMsg('');
    try {
      await api.rescheduleJob(jobId, reschedAt);
      setReschedMsg('Reschedule requested — customer notified.');
      setReschedAt('');
      await Promise.all([loadJob(), loadUpdates()]);
    } catch (err) {
      setReschedMsg(err instanceof Error ? err.message : 'Failed to reschedule');
    } finally {
      setReschedBusy(false);
    }
  }

  async function submitImage(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      if (imageMessage) form.append('message', imageMessage);
      await api.uploadJobImage(jobId, form);
      setFile(null);
      setImageMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      notify.success('Photo uploaded');
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      notify.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Loading />;
  if (!job) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Jobs', href: '/jobs' }, { label: 'Job' }]} />
        <ErrorState message={error ?? 'Job not found'} onRetry={loadJob} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Jobs', href: '/jobs' }, { label: `Job #${job.id}` }]} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Job #{job.id}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Service #{job.serviceRequestId} · Updated {formatDateTime(job.updatedAt)}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Progress tracker */}
      <Card>
        <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Job progress</p>
        <Stepper steps={PROGRESS_STEPS} current={STEP_INDEX[job.status] ?? 0} />
        <div className="mt-6 border-t border-slate-100 pt-5">
          <Timeline
            current={STEP_INDEX[job.status] ?? 0}
            steps={[
              { label: 'Assigned', icon: '📥', hint: 'Request routed to you' },
              { label: 'Accepted', icon: '🤝', hint: 'You took the job' },
              { label: 'In progress', icon: '🔧', hint: 'Work underway' },
              { label: 'Completed', icon: '✅', hint: 'Job finished & ready for payout' },
            ]}
          />
        </div>
      </Card>

      {error && <ErrorState message={error} />}

      {job.notes && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer notes</p>
          <p className="mt-1.5 text-sm text-slate-700">{job.notes}</p>
        </Card>
      )}

      {/* Status update */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Update status</h2>
        <form onSubmit={submitStatus} className="space-y-3">
          <Select
            value={status}
            onChange={(v) => setStatus(String(v))}
            options={STATUS_OPTIONS}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for the customer…"
            rows={2}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingStatus}>
              {savingStatus ? 'Saving…' : 'Update status'}
            </Button>
            {actionMsg && <span className="text-sm font-medium text-emerald-600">{actionMsg}</span>}
          </div>
        </form>
      </Card>

      {/* Reschedule */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Reschedule appointment</h2>
        <form onSubmit={submitReschedule} className="space-y-3">
          <input
            type="datetime-local"
            value={reschedAt}
            onChange={(e) => setReschedAt(e.target.value)}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!reschedAt || reschedBusy}>
              {reschedBusy ? 'Requesting…' : 'Request reschedule'}
            </Button>
            {reschedMsg && <span className="text-sm font-medium text-emerald-600">{reschedMsg}</span>}
          </div>
        </form>
      </Card>

      {/* Image upload */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Upload repair photo</h2>
        <form onSubmit={submitImage} className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <input
            value={imageMessage}
            onChange={(e) => setImageMessage(e.target.value)}
            placeholder="Optional caption…"
            className={inputClass}
          />
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload photo'}
          </Button>
        </form>
      </Card>

      {/* Timeline */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Activity timeline</h2>
        {updates.length === 0 ? (
          <Empty title="No activity yet" hint="Status updates and photos appear here in real time." icon="📋" />
        ) : (
          <ol className="space-y-3">
            {updates.map((u) => (
              <li key={u.id}>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {u.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                  </div>
                  {u.message && <p className="mt-1.5 text-sm text-slate-700">{u.message}</p>}
                  {u.imagePath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_ORIGIN}${u.imagePath}`}
                      alt="Job upload"
                      className="mt-3 max-h-64 w-full rounded-xl border border-slate-100 object-cover"
                    />
                  )}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
