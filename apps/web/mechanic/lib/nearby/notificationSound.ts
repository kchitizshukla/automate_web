'use client';

// ──────────────────────────────────────────────
// Incoming-request alert tone.
//
// Synthesised with the Web Audio API rather than shipped as an asset: no new
// dependency, no binary in the repo, and nothing to 404. Every call is
// wrapped so a blocked or unsupported AudioContext can never break the
// dispatch flow — the panel still appears, just silently.
// ──────────────────────────────────────────────

let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Browsers only allow audio after a user gesture. Call this from any click so
 * the first real alert is audible instead of silently dropped.
 */
export function unlockAudio(): void {
  const c = getContext();
  if (!c) return;
  void c.resume().catch(() => undefined);
  unlocked = c.state === 'running';
}

export function audioReady(): boolean {
  const c = getContext();
  return !!c && (unlocked || c.state === 'running');
}

/** Two short rising notes — noticeable, over in half a second, never looping. */
export function playIncomingAlert(): void {
  const c = getContext();
  if (!c) return;

  const start = () => {
    try {
      const now = c.currentTime;
      const master = c.createGain();
      master.gain.value = 0.0001;
      master.connect(c.destination);

      // Gentle envelope so it reads as a chime rather than a buzz.
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      [
        { freq: 880, at: 0, dur: 0.18 },
        { freq: 1320, at: 0.16, dur: 0.3 },
      ].forEach(({ freq, at, dur }) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + at);
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(0.9, now + at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now + at);
        osc.stop(now + at + dur + 0.02);
      });
    } catch {
      // Audio is a nicety; never let it surface as an error.
    }
  };

  if (c.state === 'suspended') {
    c.resume().then(start).catch(() => undefined);
  } else {
    start();
  }
}
