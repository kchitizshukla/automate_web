// ──────────────────────────────────────────────
// Shared REST API client used by every web & mobile frontend.
// Framework-agnostic: relies only on global fetch.
// ──────────────────────────────────────────────
import type {
  AuthResponse,
  Vehicle,
  ServiceRequest,
  Payment,
  Issue,
  Mechanic,
  MechanicProfile,
  Review,
  Earnings,
  Job,
  JobUpdate,
  Notification,
  Role,
  NearbyRequest,
  NearbyPayment,
  CreateNearbyRequestPayload,
  PricingEstimate,
  VehicleIssue,
  MechanicRatingsResponse,
  MasterPage,
  RegistrationRule,
  VehicleCategory,
  VehicleFuelType,
  VehicleInput,
  VehicleManufacturer,
  VehicleMasterBootstrap,
  VehicleModel,
  VehicleType,
  VehicleVariant,
} from '@automate/shared-types';

/** Context handed to the global error hook. */
export interface ApiErrorContext {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  path: string;
  method: string;
  /** True when the fetch itself failed (offline, DNS, server down). */
  network: boolean;
}

/**
 * Thrown for every failed request. `message` is always safe to show a user —
 * technical detail is deliberately not carried into it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly network: boolean;
  /** True once the global onError hook has surfaced this to the user, so a
   *  local catch block can avoid showing the same thing twice. */
  handled: boolean;

  constructor(message: string, ctx: ApiErrorContext, handled = false) {
    super(message);
    this.name = 'ApiError';
    this.status = ctx.status;
    this.path = ctx.path;
    this.network = ctx.network;
    this.handled = handled;
  }
}

export interface ClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  /**
   * Called for every failed request with a user-safe message. This is where
   * an app hangs its global error toast, so no screen has to handle the
   * generic cases itself.
   */
  onError?: (message: string, ctx: ApiErrorContext) => void;
  /**
   * Called whenever the number of in-flight requests crosses zero. `pending`
   * is the live count, so concurrent requests keep the loader up until the
   * last one settles.
   */
  onLoadingChange?: (active: boolean, pending: number) => void;
  /** Requests to these paths never raise the global loader (pollers). */
  quietPaths?: string[];
}

/** Anything the server sends is untrusted for display; keep it short and clean. */
function safeMessage(raw: unknown, status: number): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  // Never surface stack traces, SQL, or dumps — length and shape are the tell.
  const looksTechnical =
    /at\s+\w+\s*\(|node_modules|SequelizeError|ECONNREFUSED|SQLSTATE|error:\s*(relation|column|syntax)/i.test(
      text,
    );
  if (text && !looksTechnical && text.length <= 200) return text;

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'That conflicts with something that already exists.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Something went wrong. Please try again.';
}

/** Builds `?a=1&b=2`, dropping anything unset so URLs stay cache-friendly. */
function qs(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export class ApiClient {
  /** In-flight request count — the loader follows this, not individual calls. */
  private pending = 0;

  constructor(private opts: ClientOptions) {}

  private startRequest(quiet: boolean) {
    if (quiet) return;
    this.pending += 1;
    if (this.pending === 1) this.opts.onLoadingChange?.(true, this.pending);
  }

  private endRequest(quiet: boolean) {
    if (quiet) return;
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) this.opts.onLoadingChange?.(false, 0);
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    // Background pollers must not flash the loader every few seconds.
    const quiet = (this.opts.quietPaths ?? []).some((p) => path.startsWith(p));
    const fail = (message: string, ctx: ApiErrorContext) => {
      this.opts.onError?.(message, ctx);
      // handled=true tells call sites the user has already been told.
      return new ApiError(message, ctx, !!this.opts.onError);
    };

    const token = this.opts.getToken ? await this.opts.getToken() : null;
    const headers: Record<string, string> = {
      ...(init.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    };

    this.startRequest(quiet);
    try {
      let res: Response;
      try {
        res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers });
      } catch {
        // Offline, DNS failure, server down — never reached the server.
        throw fail('Cannot reach the server. Check your connection and try again.', {
          status: 0,
          path,
          method,
          network: true,
        });
      }

      if (res.status === 401) {
        this.opts.onUnauthorized?.();
      }

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // A non-JSON body (an HTML error page, a proxy response) is not
        // something to show the user verbatim.
        data = null;
      }

      if (!res.ok) {
        throw fail(safeMessage(data?.error, res.status), {
          status: res.status,
          path,
          method,
          network: false,
        });
      }
      return data as T;
    } finally {
      // finally, so a throw anywhere above can never strand the loader.
      this.endRequest(quiet);
    }
  }

  private body(data: unknown): RequestInit {
    return { body: JSON.stringify(data) };
  }

  // ── Auth ───────────────────────────────
  login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      ...this.body({ email, password }),
    });
  }

  signup(payload: {
    name: string; email: string; password: string; phone?: string; skills?: string;
    workshopName?: string; address?: string; certifications?: string; pricingModel?: string;
    specialization?: string; location?: string; priceFrom?: number;
  }) {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      ...this.body(payload),
    });
  }

  me() {
    return this.request<{ id: number; name: string; email: string; role: Role }>('/auth/me');
  }

  // ── Profile ────────────────────────────
  getProfile() {
    return this.request<Record<string, unknown>>('/profile');
  }
  updateProfile(payload: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/profile', { method: 'PUT', ...this.body(payload) });
  }

  // ── User: vehicle master data ──────────
  //
  // The dependent-dropdown chain. Nothing here is cached or hardcoded on the
  // client: a vehicle type, manufacturer, model or variant added to the
  // database is selectable in both apps on the next call, with no deploy.

  /** One round trip for everything an empty add-vehicle form needs. */
  vehicleMaster() {
    return this.request<VehicleMasterBootstrap>('/vehicles/master');
  }
  vehicleTypes() {
    return this.request<VehicleType[]>('/vehicles/types');
  }
  vehicleCategories(typeId?: number | null) {
    return this.request<VehicleCategory[]>(`/vehicles/categories${qs({ typeId })}`);
  }
  vehicleManufacturers(params: {
    categoryId?: number | null;
    typeId?: number | null;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.request<MasterPage<VehicleManufacturer>>(`/vehicles/manufacturers${qs(params)}`);
  }
  vehicleModels(params: {
    manufacturerId?: number | null;
    categoryId?: number | null;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.request<MasterPage<VehicleModel>>(`/vehicles/models${qs(params)}`);
  }
  vehicleVariants(modelId?: number | null) {
    return this.request<MasterPage<VehicleVariant>>(`/vehicles/variants${qs({ modelId })}`);
  }
  vehicleFuelTypes(params: { modelId?: number | null; categoryId?: number | null } = {}) {
    return this.request<VehicleFuelType[]>(`/vehicles/fuel-types${qs(params)}`);
  }
  vehicleRegistrationRules() {
    return this.request<RegistrationRule[]>('/vehicles/registration-rules');
  }

  // ── User: vehicles (the garage) ────────
  listVehicles(includeArchived = false) {
    return this.request<Vehicle[]>(`/vehicles${includeArchived ? '?includeArchived=1' : ''}`);
  }
  getVehicle(id: number) {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }
  /** Accepts master-data ids; the legacy `make`/`model` free-text form still works. */
  addVehicle(payload: VehicleInput | Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) {
    return this.request<Vehicle>('/vehicles', { method: 'POST', ...this.body(payload) });
  }
  updateVehicle(id: number, payload: Partial<VehicleInput>) {
    return this.request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', ...this.body(payload) });
  }
  /** Archives instead of deleting when the vehicle has service history. */
  deleteVehicle(id: number) {
    return this.request<{ ok: boolean; id: number; archived: boolean; message: string }>(
      `/vehicles/${id}`,
      { method: 'DELETE' },
    );
  }

  // ── User: service requests ─────────────
  listServiceRequests() {
    return this.request<ServiceRequest[]>('/services');
  }
  getServiceRequest(id: number) {
    return this.request<ServiceRequest>(`/services/${id}`);
  }
  bookService(payload: {
    vehicleId: number;
    category: string;
    description: string;
    scheduledAt?: string;
    mechanicId?: number;
  }) {
    return this.request<ServiceRequest>('/services', { method: 'POST', ...this.body(payload) });
  }
  cancelService(id: number) {
    return this.request<ServiceRequest>(`/services/${id}/cancel`, { method: 'POST' });
  }
  reviewService(serviceRequestId: number, rating: number, comment?: string) {
    return this.request<Review>(`/services/${serviceRequestId}/review`, {
      method: 'POST',
      ...this.body({ rating, comment }),
    });
  }

  // ── User: service discovery (vendor browse + profiles) ──
  discoverMechanics(filters?: { specialization?: string; minRating?: number; available?: boolean }) {
    const q = new URLSearchParams();
    if (filters?.specialization) q.set('specialization', filters.specialization);
    if (filters?.minRating != null) q.set('minRating', String(filters.minRating));
    if (filters?.available != null) q.set('available', String(filters.available));
    const qs = q.toString();
    return this.request<Mechanic[]>(`/mechanics${qs ? `?${qs}` : ''}`);
  }
  getMechanicProfile(id: number) {
    return this.request<MechanicProfile>(`/mechanics/${id}`);
  }

  // ── User: payments ─────────────────────
  listPayments() {
    return this.request<Payment[]>('/payments');
  }
  payForService(serviceRequestId: number, method: string) {
    return this.request<Payment>('/payments', {
      method: 'POST',
      ...this.body({ serviceRequestId, method }),
    });
  }

  // ── User: issues ───────────────────────
  listIssues() {
    return this.request<Issue[]>('/issues');
  }
  raiseIssue(form: FormData) {
    return this.request<Issue>('/issues', { method: 'POST', body: form });
  }

  // ── Mechanic: jobs ─────────────────────
  listJobs() {
    return this.request<Job[]>('/jobs');
  }
  acceptJob(id: number) {
    return this.request<Job>(`/jobs/${id}/accept`, { method: 'POST' });
  }
  rejectJob(id: number) {
    return this.request<Job>(`/jobs/${id}/reject`, { method: 'POST' });
  }
  updateJobStatus(id: number, status: string, notes?: string) {
    return this.request<Job>(`/jobs/${id}/status`, { method: 'POST', ...this.body({ status, notes }) });
  }
  listJobUpdates(id: number) {
    return this.request<JobUpdate[]>(`/jobs/${id}/updates`);
  }
  uploadJobImage(id: number, form: FormData) {
    return this.request<JobUpdate>(`/jobs/${id}/images`, { method: 'POST', body: form });
  }
  rescheduleJob(id: number, scheduledAt: string) {
    return this.request<Job>(`/jobs/${id}/reschedule`, { method: 'POST', ...this.body({ scheduledAt }) });
  }
  mechanicEarnings() {
    return this.request<Earnings>('/earnings');
  }
  mechanicReviews() {
    return this.request<Review[]>('/reviews');
  }
  // Service Management (mechanic CRUD)
  mechanicServices() {
    return this.request<Record<string, unknown>[]>('/services');
  }
  createMechanicService(payload: { name: string; description?: string; price?: number; duration?: string; available?: boolean; isPromotion?: boolean; promoLabel?: string }) {
    return this.request<Record<string, unknown>>('/services', { method: 'POST', ...this.body(payload) });
  }
  updateMechanicService(id: number, payload: Record<string, unknown>) {
    return this.request<Record<string, unknown>>(`/services/${id}`, { method: 'PUT', ...this.body(payload) });
  }
  deleteMechanicService(id: number) {
    return this.request<{ ok: boolean; id: number }>(`/services/${id}`, { method: 'DELETE' });
  }
  mechanicPayments() {
    return this.request<Record<string, unknown>[]>('/payments');
  }
  mechanicFeedback() {
    return this.request<{ averageRating: number; count: number; reviews: Review[] }>('/feedback');
  }

  // ── Admin ──────────────────────────────
  adminUsers() {
    return this.request<Record<string, unknown>[]>('/admin/users');
  }
  adminMechanics() {
    return this.request<Mechanic[]>('/admin/mechanics');
  }
  adminServices() {
    return this.request<ServiceRequest[]>('/admin/services');
  }
  adminAssignJob(serviceRequestId: number, mechanicId: number) {
    return this.request<Job>('/admin/assign', {
      method: 'POST',
      ...this.body({ serviceRequestId, mechanicId }),
    });
  }
  adminAnalytics() {
    return this.request<Record<string, number>>('/admin/analytics');
  }
  adminLogs() {
    return this.request<Record<string, unknown>[]>('/admin/logs');
  }
  adminApproveMechanic(id: number) {
    return this.request<Mechanic>(`/admin/mechanics/${id}/approve`, { method: 'POST' });
  }
  adminRejectMechanic(id: number) {
    return this.request<Mechanic>(`/admin/mechanics/${id}/reject`, { method: 'POST' });
  }
  adminPayments() {
    return this.request<Record<string, unknown>[]>('/admin/payments');
  }
  adminReconciliation() {
    return this.request<Record<string, number>>('/admin/reconciliation');
  }

  // ── Notifications (all roles) ──────────
  listNotifications() {
    return this.request<Notification[]>('/notifications');
  }
  markNotificationRead(id: number) {
    return this.request<Notification>(`/notifications/${id}/read`, { method: 'POST' });
  }

  // ── Find Mechanics Nearby (roadside assistance) ──
  // The user app owns creation/tracking; the mechanic app owns the response.
  nearbyIssues() {
    return this.request<VehicleIssue[]>('/nearby/issues');
  }
  nearbyConfig() {
    return this.request<{
      etaSpeedup: number;
      responseTimeoutSeconds: number;
      averageSpeedKmph: number;
      fallbackLocation: { latitude: number; longitude: number; label?: string | null };
    }>('/nearby/config');
  }
  estimateNearbyPrice(payload: { issueKey: string; vehicleId?: number; distanceKm?: number | null }) {
    return this.request<PricingEstimate>('/nearby/estimate', {
      method: 'POST',
      ...this.body(payload),
    });
  }
  createNearbyRequest(payload: CreateNearbyRequestPayload) {
    return this.request<NearbyRequest>('/nearby/requests', {
      method: 'POST',
      ...this.body(payload),
    });
  }
  /** null when the user has nothing in flight. */
  activeNearbyRequest() {
    return this.request<NearbyRequest | null>('/nearby/requests/active');
  }
  latestNearbyRequest() {
    return this.request<NearbyRequest | null>('/nearby/requests/latest');
  }
  getNearbyRequest(id: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}`);
  }
  cancelNearbyRequest(id: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/cancel`, { method: 'POST' });
  }

  // Mechanic side
  mechanicNearbyRequests() {
    return this.request<NearbyRequest[]>('/nearby/requests');
  }
  mechanicNearbyHistory() {
    return this.request<NearbyRequest[]>('/nearby/requests/history');
  }
  /** Server-side guard against replaying the alert sound for one request. */
  markNearbyAlerted(id: number) {
    return this.request<{ ok: boolean; firstAlert: boolean }>(`/nearby/requests/${id}/alerted`, {
      method: 'POST',
    });
  }
  acceptNearbyRequest(id: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/accept`, { method: 'POST' });
  }
  rejectNearbyRequest(id: number, reason?: string) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/reject`, {
      method: 'POST',
      ...this.body({ reason }),
    });
  }
  updateNearbyStatus(id: number, status: string) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/status`, {
      method: 'POST',
      ...this.body({ status }),
    });
  }
  /** Completing needs a final amount — there is no amount-less completion. */
  completeNearbyJob(id: number, finalAmount: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/complete`, {
      method: 'POST',
      ...this.body({ finalAmount }),
    });
  }
  /** Average, total and distribution, derived from the review rows. */
  mechanicRatings() {
    return this.request<MechanicRatingsResponse>('/nearby/ratings');
  }

  // ── Payment & rating (user side) ───────
  getNearbyPayment(id: number) {
    return this.request<NearbyPayment | null>(`/nearby/requests/${id}/payment`);
  }
  payNearbyOnline(id: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/payment/online`, { method: 'POST' });
  }
  selectNearbyCash(id: number) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/payment/cash`, { method: 'POST' });
  }
  rateNearbyJob(id: number, rating: number, review?: string | null) {
    return this.request<NearbyRequest>(`/nearby/requests/${id}/rating`, {
      method: 'POST',
      ...this.body({ rating, review }),
    });
  }
}

export function createClient(opts: ClientOptions) {
  return new ApiClient(opts);
}

// Shared API activity store used by every app's global loader.
export * from './activity';
