'use client';

// ──────────────────────────────────────────────
// Location provider for the roadside-assistance flow.
//
// Real browser geolocation when the user allows it, a clearly-labelled mock
// position when they do not. Everything that needs a coordinate goes through
// requestLocation(), so swapping in a native GPS bridge (or a different
// fallback city) is a change to this file alone.
// ──────────────────────────────────────────────
import type { GeoLocation, LocationSource } from '@automate/shared-types';
import { MOCK_LOCATION_CONFIG } from '@automate/shared-utils';

export type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

export interface LocationResult {
  location: GeoLocation;
  source: LocationSource;
  status: LocationStatus;
  /** User-facing explanation when we fell back to an approximate position. */
  message?: string;
}

const GEO_TIMEOUT_MS = 8000;

/** The labelled stand-in used whenever a real fix is not available. */
export function fallbackLocation(): GeoLocation {
  return { ...MOCK_LOCATION_CONFIG.fallbackUserLocation };
}

/**
 * Never rejects: a roadside request must not be blocked by a permission
 * prompt. Callers get a usable location plus an honest `source`/`status`.
 */
export function requestLocation(): Promise<LocationResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({
      location: fallbackLocation(),
      source: 'mock',
      status: 'unavailable',
      message: 'Location services are not available on this device — using an approximate area.',
    });
  }

  return new Promise<LocationResult>((resolve) => {
    let settled = false;
    const finish = (r: LocationResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    // Some browsers never invoke either callback if the prompt is dismissed.
    const timer = setTimeout(
      () =>
        finish({
          location: fallbackLocation(),
          source: 'mock',
          status: 'unavailable',
          message: 'Could not get a GPS fix in time — using an approximate area.',
        }),
      GEO_TIMEOUT_MS + 500,
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        finish({
          location: {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy ?? null,
            label: 'Your current location',
          },
          source: 'gps',
          status: 'ready',
        });
      },
      (err) => {
        clearTimeout(timer);
        const denied = err.code === err.PERMISSION_DENIED;
        finish({
          location: fallbackLocation(),
          source: 'mock',
          status: denied ? 'denied' : 'unavailable',
          message: denied
            ? 'Location permission is blocked, so we are using an approximate area. You can still request a mechanic.'
            : 'We could not read your exact position — using an approximate area.',
        });
      },
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: 30_000 },
    );
  });
}

/** Short label for a coordinate pair, used under the map and on chips. */
export function describeLocation(loc: GeoLocation | null | undefined): string {
  if (!loc) return 'Location unknown';
  if (loc.label) return loc.label;
  return `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
}
