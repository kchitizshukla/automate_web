/* AutoMate wordmark — shared by the landing nav, footer and auth handoff. */

import { APP_NAME } from '@automate/shared-brand';

export function Brandmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber/40 bg-amber/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-amber" aria-hidden="true">
          <path
            d="M3 16v2.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V17h10v1.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V16M3 16l1.6-5.4A3 3 0 0 1 7.5 8.5h9a3 3 0 0 1 2.9 2.1L21 16H3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-bone">
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
