import { createClient, createApiActivity } from '@automate/shared-api';
import { notify } from '@/components/kit';
import { API_BASE_URL, TOKEN_KEY } from './config';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function onUnauthorized() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem('am_mechanic_user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Global API activity. The client reports every in-flight request here and
 * <GlobalLoader /> renders from it, so no screen wires a loader by hand.
 */
export const apiActivity = createApiActivity();

/** Pollers that run on a timer must not flash the loader every few seconds. */
const QUIET_PATHS = ['/nearby/requests'];

export const api = createClient({
  baseUrl: API_BASE_URL,
  getToken,
  onUnauthorized,
  quietPaths: QUIET_PATHS,
  onLoadingChange: (active, pending) => apiActivity.set(active, pending),
  // Every API failure surfaces as one standard toast. Screens may still catch
  // the error for their own UI; notify() dedupes by message so it shows once.
  onError: (message) => notify.error(message),
});
