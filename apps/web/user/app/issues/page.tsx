'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatDateTime } from '@automate/shared-utils';
import type { Issue } from '@automate/shared-types';
import { api, apiOrigin } from '@/lib/api';
import {
  normalizeIssue,
  normalizeService,
  type ServiceRequestView,
} from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import {
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  inputClass,
} from '@/components/ui';

function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [services, setServices] = useState<ServiceRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    serviceRequestId: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [i, s] = await Promise.all([
        api.listIssues(),
        api.listServiceRequests(),
      ]);
      setIssues(i.map(normalizeIssue));
      setServices(s.map(normalizeService));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (form.serviceRequestId)
        fd.append('serviceRequestId', form.serviceRequestId);
      if (file) fd.append('image', file);
      await api.raiseIssue(fd);
      setForm({ title: '', description: '', serviceRequestId: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to raise issue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Issues" subtitle="Report and track problems" />

      <Card className="mb-6 max-w-xl">
        <h2 className="mb-4 text-base font-semibold">Raise an issue</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Related service (optional)">
            <Select
              value={form.serviceRequestId}
              onChange={(v) => setForm({ ...form, serviceRequestId: String(v) })}
              placeholder="None"
              options={[
                { value: '', label: 'None' },
                ...services.map((s) => ({ value: s.id, label: `#${s.id} · ${s.category}` })),
              ]}
            />
          </Field>
          <Field label="Attach image (optional)">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </Field>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit issue'}
          </Button>
        </form>
      </Card>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : issues.length === 0 ? (
        <Empty title="No issues reported" hint="Raise one above if you need help." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {issues.map((i) => (
            <Card key={i.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{i.title}</p>
                <StatusBadge status={i.status} />
              </div>
              <p className="mt-1 text-sm text-gray-600">{i.description}</p>
              {i.imagePath && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`${apiOrigin}${i.imagePath}`}
                  alt={i.title}
                  className="mt-3 max-h-40 rounded-lg border object-cover"
                />
              )}
              <p className="mt-3 text-xs text-gray-400">
                {formatDateTime(i.createdAt)}
                {i.serviceRequestId != null &&
                  ` · Service #${i.serviceRequestId}`}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Issues />
    </Protected>
  );
}
