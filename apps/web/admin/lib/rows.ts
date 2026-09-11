// Backend admin endpoints return raw PostgreSQL rows (snake_case) rather than the
// camelCase shared-types domain objects. These loose row shapes describe what
// /admin/* actually sends, with optional fields so we can read either casing.

export interface UserRow {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface MechanicRow {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  skills?: string;
  specialization?: string;
  available?: number | boolean;
  rating?: number;
  status?: string;
  approval_status?: string;
  approvalStatus?: string;
  created_at?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface PaymentRow {
  id: number;
  transaction_ref?: string;
  transactionRef?: string;
  user_name?: string;
  userName?: string;
  amount?: number;
  method?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface ServiceRow {
  id?: number;
  service_request_id?: number;
  category?: string;
  status: string;
  mechanic_id?: number | null;
  mechanicId?: number | null;
  price?: number | null;
  created_at?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface LogRow {
  id: number;
  actor_role?: string;
  actorRole?: string;
  actor_id?: number | null;
  action?: string;
  detail?: string | null;
  created_at?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export const srId = (s: ServiceRow): number =>
  (s.service_request_id ?? s.id) as number;

export const mechId = (s: ServiceRow): number | null =>
  (s.mechanic_id ?? s.mechanicId ?? null) as number | null;

export const isAvailable = (m: MechanicRow): boolean =>
  m.available === true || m.available === 1;

export const approvalOf = (m: MechanicRow): string =>
  String(m.approval_status ?? m.approvalStatus ?? 'pending');

export const createdOf = (
  r: { created_at?: string; createdAt?: string },
): string | undefined => r.created_at ?? r.createdAt;
