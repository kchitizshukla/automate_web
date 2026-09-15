/* AutoMate wordmark — shared by the landing nav, footer and auth handoff.

   The mark is a chevron "A" cut from a single azure gradient; the wordmark
   splits "Auto" (bone) from "Mate" (azure) so the logotype still reads at
   favicon size where the letterforms are gone. */

import { APP_NAME } from '@automate/shared-brand';

/** "AutoMate" → ["Auto", "Mate"], so the split survives a rename. */
function splitName(name: string): [string, string] {
  const at = name.length > 4 ? Math.ceil(name.length / 2) : name.length;
  return [name.slice(0, at), name.slice(at)];
}

export function Brandmark({
  compact = false,
  size = 'md',
}: {
  compact?: boolean;
  /** `lg` for the hero-adjacent nav, `md` everywhere else. */
  size?: 'md' | 'lg';
}) {
  const [head, tail] = splitName(APP_NAME);
  const glyph = size === 'lg' ? 'h-9 w-9' : 'h-8 w-8';
  const type = size === 'lg' ? 'text-[1.6rem]' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" fill="none" className={glyph} aria-hidden="true">
        <defs>
          <linearGradient id="am-mark" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1668D8" />
            <stop offset="55%" stopColor="#2B8FFF" />
            <stop offset="100%" stopColor="#5EA9FF" />
          </linearGradient>
        </defs>
        {/* Outer chevron — the "A" apex and both legs. */}
        <path
          d="M16 2.6 30 29.4h-6.6L16 14 8.6 29.4H2L16 2.6Z"
          fill="url(#am-mark)"
        />
        {/* Crossbar, offset so the counter reads as a road rather than a gap. */}
        <path d="M11.6 21.3h8.8l2.6 5H9l2.6-5Z" fill="url(#am-mark)" opacity="0.62" />
      </svg>
      {compact ? (
        <span className="sr-only">{APP_NAME}</span>
      ) : (
        <span className={`font-display font-extrabold tracking-tight ${type}`}>
          <span className="text-bone">{head}</span>
          <span className="text-azure">{tail}</span>
        </span>
      )}
    </span>
  );
}
