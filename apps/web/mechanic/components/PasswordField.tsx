'use client';

import React, { useId, useState } from 'react';
import { classNames } from '@automate/shared-utils';
import { Field, inputClass } from '@/components/ui';

/**
 * Masked input with an independent show/hide toggle.
 *
 * Each instance owns its own visibility state, so "Create password" and
 * "Confirm password" reveal separately.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  placeholder,
  invalid,
  hint,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
  placeholder?: string;
  /** Draws the error treatment without owning the message. */
  invalid?: boolean;
  hint?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();

  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className={classNames(
            inputClass,
            'pr-11',
            invalid && 'border-red-400 focus:border-red-400 focus:ring-red-500/20',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Not a tab stop: keyboard users move straight to the next field.
          tabIndex={-1}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-slate-700"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className={classNames('mt-1 text-xs', invalid ? 'text-red-600' : 'text-slate-400')}>
          {hint}
        </p>
      )}
    </Field>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 10.6a3 3 0 104.2 4.2M9.9 5.2A9.6 9.6 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4.1M6.2 6.2A17 17 0 002 12s3.6 7 10 7a9.7 9.7 0 004-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
