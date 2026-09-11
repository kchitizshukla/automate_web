'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Empty, ErrorState, PageHeader, SkeletonCards, Button, Field, inputClass } from '@/components/ui';

interface ServiceRow {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  duration?: string | null;
  available: number | boolean;
  is_promotion: number | boolean;
  promo_label?: string | null;
}

const EMPTY = { name: '', description: '', price: '', duration: '', available: true, isPromotion: false, promoLabel: '' };

export default function ServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows((await api.mechanicServices()) as unknown as ServiceRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startCreate() { setForm(EMPTY); setEditingId(null); setShowForm(true); }
  function startEdit(s: ServiceRow) {
    setForm({
      name: s.name, description: s.description ?? '', price: String(s.price ?? ''),
      duration: s.duration ?? '', available: Boolean(s.available),
      isPromotion: Boolean(s.is_promotion), promoLabel: s.promo_label ?? '',
    });
    setEditingId(s.id); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const payload = {
        name: form.name, description: form.description, price: Number(form.price) || 0,
        duration: form.duration, available: form.available, isPromotion: form.isPromotion, promoLabel: form.promoLabel || null,
      };
      if (editingId) await api.updateMechanicService(editingId, payload);
      else await api.createMechanicService(payload);
      setShowForm(false); setForm(EMPTY); setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this service?')) return;
    try { await api.deleteMechanicService(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  }

  return (
    <>
      <PageHeader
        title="Service Management"
        subtitle="Define the services you offer, set pricing & promotions"
        action={<Button onClick={startCreate}>+ Add service</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <h3 className="mb-4 font-display font-bold text-slate-900">{editingId ? 'Edit service' : 'New service'}</h3>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Service name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Price (₹)"><input type="number" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Duration"><input className={inputClass} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hrs" /></Field>
            <Field label="Promotion label"><input className={inputClass} value={form.promoLabel} onChange={(e) => setForm({ ...form, promoLabel: e.target.value })} placeholder="e.g. Monsoon -10%" /></Field>
            <div className="sm:col-span-2">
              <Field label="Description"><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600" checked={form.isPromotion} onChange={(e) => setForm({ ...form, isPromotion: e.target.checked })} /> Mark as promotion
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update service' : 'Create service'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <SkeletonCards count={3} />
      ) : rows.length === 0 ? (
        <Empty title="No services yet" hint="Add your first service offering." icon="🧰">
          <Button onClick={startCreate}>+ Add service</Button>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((s) => (
            <Card key={s.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold text-slate-900">{s.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.available ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {s.available ? 'Active' : 'Off'}
                </span>
              </div>
              {s.is_promotion && s.promo_label && (
                <span className="mt-2 inline-flex w-fit rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">🎁 {s.promo_label}</span>
              )}
              {s.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{s.description}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-display text-lg font-bold text-gradient">{formatCurrency(Number(s.price))}</span>
                <span className="text-xs text-slate-400">{s.duration ?? '—'}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1 !py-2" onClick={() => startEdit(s)}>Edit</Button>
                <Button variant="danger" className="!py-2" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
