'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import {
  Button,
  Card,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  inputClass,
} from '@/components/ui';

interface ProfileData {
  id?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
}

function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ProfileData>({});
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = (await api.getProfile()) as ProfileData;
      setProfile(p);
      setForm({
        name: p.name ?? '',
        phone: (p.phone as string) ?? '',
        address: (p.address as string) ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const updated = (await api.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
      })) as ProfileData;
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader title="Profile" subtitle="View and edit your details" />

      <Card className="max-w-xl">
        <div className="mb-5 rounded-lg bg-gray-50 p-4 text-sm">
          <p className="text-gray-500">Signed in as</p>
          <p className="font-medium">{profile.email}</p>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Address">
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass}
            />
          </Field>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          {saved && <p className="text-sm text-green-600">Profile updated.</p>}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
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
