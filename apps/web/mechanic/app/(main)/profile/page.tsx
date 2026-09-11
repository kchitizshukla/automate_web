'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { Loading, ErrorState } from '@/components/ui';
import { RatingsSummary } from '@/components/nearby/RatingsSummary';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [available, setAvailable] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await api.getProfile();
      setProfile(p);
      setName((p.name as string) ?? '');
      setPhone((p.phone as string) ?? '');
      setSkills((p.skills as string) ?? '');
      setAvailable(Boolean(p.available));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(payload: Record<string, unknown>, msg: string) {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setSavedMsg(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await save({ name, phone, skills }, 'Profile saved.');
  }

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    await save({ available: next }, next ? 'You are now available.' : 'You are now unavailable.');
  }

  if (loading) return <Loading />;
  if (error && !profile) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {error && <ErrorState message={error} />}

      <section className="card flex items-center justify-between">
        <div>
          <p className="font-medium">Availability</p>
          <p className="text-sm text-gray-500">
            Toggle whether you can be assigned new jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAvailability}
          disabled={saving}
          aria-pressed={available}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            available ? 'bg-emerald-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              available ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </section>

      <section className="card">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <input
              value={(profile?.email as string) ?? ''}
              disabled
              className="input bg-gray-50 text-gray-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Skills</span>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Engine, Brakes, Electrical"
              className="input"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
          </div>
        </form>
      </section>

      {/* Ratings live on the existing profile screen rather than a new one. */}
      <RatingsSummary />
    </div>
  );
}
