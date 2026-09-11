'use client';

// ──────────────────────────────────────────────
// Add / edit a vehicle — the dependent-dropdown chain.
//
//   Type → Category → Manufacturer → Model → Variant → Power type
//        → Year → Registration number → Save
//
// Every option on screen comes from the API. There is no vehicle list, brand
// list or format table in this file, so a category or model added to the
// database appears here without touching the frontend.
// ──────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Vehicle, VehicleCategory } from '@automate/shared-types';
import {
  classNames,
  resolveRegistrationRule,
  normalizeRegistrationNo,
  validateRegistrationNo,
  validateVehicleYear,
  MIN_VEHICLE_YEAR,
  maxVehicleYear,
} from '@automate/shared-utils';
import {
  OTHER_OPTION_ID,
  isOther,
  toOptions,
  useVehicleCategories,
  useVehicleFuelTypes,
  useVehicleManufacturers,
  useVehicleMaster,
  useVehicleModels,
  useVehicleVariants,
} from '@/lib/vehicleMaster';
import { Button, ErrorState, Field, Loading, Select, inputClass } from '@/components/ui';

interface Selection {
  typeId: number | null;
  categoryId: number | null;
  manufacturerId: number | null;
  modelId: number | null;
  variantId: number | null;
  fuelTypeId: number | null;
  customManufacturer: string;
  customModel: string;
  customVariant: string;
  nickname: string;
  year: string;
  registrationNo: string;
}

const EMPTY: Selection = {
  typeId: null,
  categoryId: null,
  manufacturerId: null,
  modelId: null,
  variantId: null,
  fuelTypeId: null,
  customManufacturer: '',
  customModel: '',
  customVariant: '',
  nickname: '',
  year: '',
  registrationNo: '',
};

function fromVehicle(v: Vehicle): Selection {
  return {
    typeId: v.vehicleTypeId ?? null,
    categoryId: v.vehicleCategoryId ?? null,
    // A legacy row with only free text lands on the "Other" branch, pre-filled.
    manufacturerId: v.manufacturerId ?? (v.customManufacturer ? OTHER_OPTION_ID : null),
    modelId: v.modelId ?? (v.customModel ? OTHER_OPTION_ID : null),
    variantId: v.variantId ?? null,
    fuelTypeId: v.fuelTypeId ?? null,
    customManufacturer: v.customManufacturer ?? '',
    customModel: v.customModel ?? '',
    customVariant: v.customVariant ?? '',
    nickname: v.nickname ?? '',
    year: v.year ? String(v.year) : '',
    registrationNo: v.registrationNo ?? '',
  };
}

/* ── Tile pickers — the top two levels are short enough to show at once ── */

function TileGrid({
  children,
  columns = 'sm:grid-cols-3 lg:grid-cols-4',
}: {
  children: React.ReactNode;
  columns?: string;
}) {
  return <div className={classNames('grid grid-cols-2 gap-2', columns)}>{children}</div>;
}

function Tile({
  icon,
  label,
  hint,
  selected,
  onClick,
}: {
  icon?: string | null;
  label: string;
  hint?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={classNames(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
        selected
          ? 'border-brand bg-brand/5 shadow-sm ring-2 ring-brand/15'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg">
        {icon || '🚗'}
      </span>
      <span className="min-w-0">
        <span className={classNames('block truncate text-sm', selected ? 'font-semibold text-brand' : 'font-medium text-slate-800')}>
          {label}
        </span>
        {hint && <span className="block truncate text-xs text-slate-400">{hint}</span>}
      </span>
    </button>
  );
}

/* ── The form ─────────────────────────────────── */

export interface VehicleFormProps {
  /** Present when editing; the form pre-fills and switches to "Save changes". */
  vehicle?: Vehicle | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function VehicleForm({ vehicle, onSubmit, onCancel, submitLabel }: VehicleFormProps) {
  const master = useVehicleMaster();
  const [sel, setSel] = useState<Selection>(vehicle ? fromVehicle(vehicle) : EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const set = useCallback(<K extends keyof Selection>(key: K, value: Selection[K]) => {
    setSel((s) => ({ ...s, [key]: value }));
  }, []);

  const categories = useVehicleCategories(sel.typeId);
  const manufacturers = useVehicleManufacturers(sel.categoryId);
  const models = useVehicleModels(sel.manufacturerId, sel.categoryId);
  const variants = useVehicleVariants(sel.modelId);
  const fuelTypes = useVehicleFuelTypes(sel.modelId, sel.categoryId, master.fuelTypes);

  const category: VehicleCategory | undefined = categories.items.find((c) => c.id === sel.categoryId);

  // Choosing a level invalidates everything below it.
  const chooseType = (typeId: number) =>
    setSel((s) => ({ ...s, typeId, categoryId: null, manufacturerId: null, modelId: null, variantId: null, fuelTypeId: null }));
  const chooseCategory = (categoryId: number) =>
    setSel((s) => ({ ...s, categoryId, manufacturerId: null, modelId: null, variantId: null, fuelTypeId: null }));
  const chooseManufacturer = (manufacturerId: number) =>
    setSel((s) => ({ ...s, manufacturerId, modelId: null, variantId: null, customManufacturer: '' }));
  const chooseModel = (modelId: number) =>
    setSel((s) => ({ ...s, modelId, variantId: null, customModel: '' }));

  // A legacy row may carry a category but no type; the type settles the tiles.
  useEffect(() => {
    if (!vehicle || sel.typeId != null || vehicle.vehicleTypeId == null) return;
    set('typeId', vehicle.vehicleTypeId);
  }, [vehicle, sel.typeId, set]);

  // A category that is electric by definition settles the power type for us.
  useEffect(() => {
    if (sel.fuelTypeId != null || fuelTypes.items.length !== 1) return;
    set('fuelTypeId', fuelTypes.items[0].id);
  }, [fuelTypes.items, sel.fuelTypeId, set]);

  const rule = useMemo(
    () => resolveRegistrationRule(master.rules, { vehicleTypeId: sel.typeId, vehicleCategoryId: sel.categoryId }),
    [master.rules, sel.typeId, sel.categoryId],
  );

  const errors = useMemo(() => {
    if (!touched) return {} as Record<string, string | null>;
    return {
      category: sel.categoryId == null ? 'Choose a vehicle category' : null,
      manufacturer:
        sel.manufacturerId == null
          ? 'Choose a manufacturer'
          : isOther(sel.manufacturerId) && !sel.customManufacturer.trim()
            ? 'Type the manufacturer name'
            : null,
      model:
        sel.modelId == null
          ? 'Choose a model'
          : isOther(sel.modelId) && !sel.customModel.trim()
            ? 'Type the model name'
            : null,
      variant: isOther(sel.variantId) && !sel.customVariant.trim() ? 'Type the variant name' : null,
      year: validateVehicleYear(sel.year),
      registrationNo: validateRegistrationNo(sel.registrationNo, rule),
    };
  }, [touched, sel, rule]);

  const valid =
    sel.categoryId != null &&
    sel.manufacturerId != null &&
    sel.modelId != null &&
    !validateVehicleYear(sel.year) &&
    !validateRegistrationNo(sel.registrationNo, rule) &&
    (!isOther(sel.manufacturerId) || !!sel.customManufacturer.trim()) &&
    (!isOther(sel.modelId) || !!sel.customModel.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError('');
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        vehicleTypeId: sel.typeId,
        vehicleCategoryId: sel.categoryId,
        manufacturerId: sel.manufacturerId,
        modelId: sel.modelId,
        variantId: sel.variantId,
        fuelTypeId: sel.fuelTypeId,
        customManufacturer: isOther(sel.manufacturerId) ? sel.customManufacturer.trim() : null,
        customModel: isOther(sel.modelId) ? sel.customModel.trim() : null,
        customVariant: isOther(sel.variantId) ? sel.customVariant.trim() : null,
        nickname: sel.nickname.trim() || null,
        year: Number(sel.year),
        registrationNo: normalizeRegistrationNo(sel.registrationNo),
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the vehicle');
    } finally {
      setSaving(false);
    }
  }

  if (master.loading) return <Loading label="Loading vehicle options…" />;
  if (master.error) return <ErrorState message={master.error} onRetry={master.reload} />;

  const err = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  const moreFooter = (list: { hasMore: boolean; loadingMore: boolean; loadMore: () => void }) =>
    list.hasMore ? (
      <button
        type="button"
        onClick={list.loadMore}
        disabled={list.loadingMore}
        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5 disabled:opacity-50"
      >
        {list.loadingMore ? 'Loading…' : 'Load more'}
      </button>
    ) : null;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* 1 — Vehicle type */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">
          1. What kind of vehicle is it?
        </p>
        <TileGrid>
          {master.types.map((t) => (
            <Tile
              key={t.id}
              icon={t.icon}
              label={t.name}
              hint={t.categoryCount ? `${t.categoryCount} categor${t.categoryCount === 1 ? 'y' : 'ies'}` : undefined}
              selected={sel.typeId === t.id}
              onClick={() => chooseType(t.id)}
            />
          ))}
        </TileGrid>
      </div>

      {/* 2 — Category */}
      {sel.typeId != null && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">2. Pick the category</p>
          {categories.loading ? (
            <Loading label="Loading categories…" />
          ) : categories.error ? (
            <ErrorState message={categories.error} onRetry={categories.reload} />
          ) : categories.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No categories are set up for this vehicle type yet.
            </p>
          ) : (
            <TileGrid>
              {categories.items.map((c) => (
                <Tile
                  key={c.id}
                  icon={c.icon}
                  label={c.name}
                  hint={c.description}
                  selected={sel.categoryId === c.id}
                  onClick={() => chooseCategory(c.id)}
                />
              ))}
            </TileGrid>
          )}
          {err('category')}
        </div>
      )}

      {/* 3–6 — the rest of the chain */}
      {sel.categoryId != null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Field label="3. Manufacturer">
              <Select
                value={sel.manufacturerId ?? ''}
                onChange={(v) => chooseManufacturer(Number(v))}
                options={toOptions(manufacturers.items)}
                placeholder="Select manufacturer…"
                searchable
                onSearch={manufacturers.setSearch}
                loading={manufacturers.loading}
                error={manufacturers.error}
                onRetry={manufacturers.reload}
                emptyText={`No manufacturers listed for ${category?.name ?? 'this category'} yet — choose “Other”.`}
                footer={moreFooter(manufacturers)}
                ariaLabel="Manufacturer"
              />
            </Field>
            {isOther(sel.manufacturerId) && (
              <input
                autoFocus
                value={sel.customManufacturer}
                onChange={(e) => set('customManufacturer', e.target.value)}
                placeholder="Manufacturer name (required)"
                aria-label="Manufacturer name"
                className={classNames(inputClass, 'mt-2')}
              />
            )}
            {err('manufacturer')}
          </div>

          <div>
            <Field label="4. Model">
              <Select
                value={sel.modelId ?? ''}
                onChange={(v) => chooseModel(Number(v))}
                options={toOptions(models.items)}
                placeholder={sel.manufacturerId == null ? 'Pick a manufacturer first' : 'Select model…'}
                disabled={sel.manufacturerId == null}
                searchable
                onSearch={models.setSearch}
                loading={models.loading}
                error={models.error}
                onRetry={models.reload}
                emptyText="No models listed for this manufacturer yet — choose “Other”."
                footer={moreFooter(models)}
                ariaLabel="Model"
              />
            </Field>
            {isOther(sel.modelId) && (
              <input
                autoFocus
                value={sel.customModel}
                onChange={(e) => set('customModel', e.target.value)}
                placeholder="Model name (required)"
                aria-label="Model name"
                className={classNames(inputClass, 'mt-2')}
              />
            )}
            {err('model')}
          </div>

          <div>
            <Field label="5. Variant (optional)">
              <Select
                value={sel.variantId ?? ''}
                onChange={(v) => set('variantId', Number(v))}
                options={toOptions(variants.items)}
                placeholder={sel.modelId == null ? 'Pick a model first' : 'Select variant…'}
                disabled={sel.modelId == null}
                searchable={variants.items.length > 8}
                loading={variants.loading}
                error={variants.error}
                onRetry={variants.reload}
                emptyText="No variants listed for this model."
                ariaLabel="Variant"
              />
            </Field>
            {isOther(sel.variantId) && (
              <input
                value={sel.customVariant}
                onChange={(e) => set('customVariant', e.target.value)}
                placeholder="Variant name"
                aria-label="Variant name"
                className={classNames(inputClass, 'mt-2')}
              />
            )}
            {err('variant')}
          </div>

          <div>
            <Field label="6. Fuel / power type">
              <Select
                value={sel.fuelTypeId ?? ''}
                onChange={(v) => set('fuelTypeId', Number(v))}
                options={toOptions(fuelTypes.items)}
                placeholder="Select power type…"
                loading={fuelTypes.loading}
                error={fuelTypes.error}
                emptyText="No power types configured."
                ariaLabel="Fuel or power type"
              />
            </Field>
            {category?.isElectric && (
              <p className="mt-1 text-xs text-emerald-600">⚡ This category is fully electric.</p>
            )}
          </div>

          <Field label="Manufacturing year">
            <input
              required
              type="number"
              inputMode="numeric"
              min={MIN_VEHICLE_YEAR}
              max={maxVehicleYear()}
              value={sel.year}
              onChange={(e) => set('year', e.target.value)}
              className={inputClass}
            />
            {err('year')}
          </Field>

          <Field label="Registration number">
            <input
              required
              value={sel.registrationNo}
              onChange={(e) => set('registrationNo', e.target.value.toUpperCase())}
              placeholder={rule.placeholder ?? 'Registration number'}
              maxLength={rule.maxLength}
              className={classNames(inputClass, 'font-mono tracking-wider')}
            />
            {errors.registrationNo ? (
              err('registrationNo')
            ) : rule.helpText ? (
              <p className="mt-1 text-xs text-slate-400">{rule.helpText}</p>
            ) : null}
          </Field>

          <Field label="Nickname (optional)">
            <input
              value={sel.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              placeholder="e.g. Weekend ride"
              className={inputClass}
              maxLength={40}
            />
          </Field>
        </div>
      )}

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving || sel.categoryId == null}>
          {saving ? 'Saving…' : (submitLabel ?? (vehicle ? 'Save changes' : 'Add vehicle'))}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
