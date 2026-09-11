'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Loading, ErrorState, PageHeader, Card } from '@/components/ui';

export default function ProfilePage() {
  const { data, loading, error, reload } = useApi(() => api.getProfile(), []);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const profile = (data ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (profile.name) setName(String(profile.name));
  }, [data]);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api.updateProfile({ name });
      setMsg({ text: 'Profile updated.', ok: true });
      setEditing(false);
      reload();
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : 'Update failed',
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Loading profile…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" subtitle="Your administrator account." />
      <Card className="p-6">
        <Row label="Email" value={String(profile.email ?? '—')} />
        <Row label="Role" value={String(profile.role ?? 'admin')} capitalize />

        <div className="mt-4">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </span>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <p className="text-sm text-gray-900">{profile.name ? String(profile.name) : '—'}</p>
          )}
        </div>

        {msg && (
          <p
            className={`mt-3 text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}
          >
            {msg.text}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(String(profile.name ?? ''));
                  setMsg(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit name
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <p className={`text-sm text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}
