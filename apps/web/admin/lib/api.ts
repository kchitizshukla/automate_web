import { createClient, ApiClient, createApiActivity } from '@automate/shared-api';
import { notify } from '@/components/kit';

export const TOKEN_KEY = 'am_admin_token';
export const USER_KEY = 'am_admin_user';

const baseUrl =
  process.env.NEXT_PUBLIC_ADMIN_API || 'http://localhost:4000/api/admin';

/**
 * Global API activity. The client reports every in-flight request here and
 * <GlobalLoader /> renders from it, so no screen wires a loader by hand.
 */
export const apiActivity = createApiActivity();

/** Pollers that run on a timer must not flash the loader every few seconds. */
const QUIET_PATHS = ['/nearby/requests/active', '/nearby/requests/latest', '/nearby/requests'];

export const api: ApiClient = createClient({
  baseUrl,
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  quietPaths: QUIET_PATHS,
  onLoadingChange: (active, pending) => apiActivity.set(active, pending),
  // Every API failure surfaces as one standard toast. Screens may still catch
  // the error for their own UI; notify() dedupes by message so it shows once.
  onError: (message) => notify.error(message),
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

// Absolute base for image / upload paths served by the backend.
export const apiOrigin = baseUrl.replace(/\/api\/?$/, '');
