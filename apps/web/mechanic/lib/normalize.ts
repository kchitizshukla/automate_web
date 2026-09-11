// Backend returns raw PostgreSQL rows in snake_case for several endpoints
// (SELECT *), while shared-types are camelCase. These helpers normalize.

import type { Job, JobUpdate, Review, Notification } from '@automate/shared-types';

type Row = Record<string, any>;

function num(v: any): number {
  return typeof v === 'number' ? v : Number(v);
}

export function normalizeJob(r: Row): Job {
  return {
    id: num(r.id),
    serviceRequestId: num(r.service_request_id ?? r.serviceRequestId),
    mechanicId: num(r.mechanic_id ?? r.mechanicId),
    status: r.status,
    notes: r.notes ?? null,
    createdAt: r.created_at ?? r.createdAt,
    updatedAt: r.updated_at ?? r.updatedAt,
    // Joined / extra columns the /jobs query may carry (scheduled_at, price, etc.)
    ...(r.scheduled_at ?? r.scheduledAt ? { scheduledAt: r.scheduled_at ?? r.scheduledAt } : {}),
    ...(r.price !== undefined && r.price !== null ? { price: num(r.price) } : {}),
  } as Job & { scheduledAt?: string; price?: number };
}

export function normalizeJobUpdate(r: Row): JobUpdate {
  return {
    id: num(r.id),
    jobId: num(r.job_id ?? r.jobId),
    type: r.type,
    message: r.message ?? null,
    imagePath: r.image_path ?? r.imagePath ?? null,
    createdAt: r.created_at ?? r.createdAt,
  };
}

export function normalizeReview(r: Row): Review {
  return {
    id: num(r.id),
    serviceRequestId: num(r.service_request_id ?? r.serviceRequestId),
    mechanicId: num(r.mechanic_id ?? r.mechanicId),
    userId: num(r.user_id ?? r.userId),
    userName: r.user_name ?? r.userName,
    rating: num(r.rating),
    comment: r.comment ?? null,
    createdAt: r.created_at ?? r.createdAt,
  };
}

export function normalizeNotification(r: Row): Notification {
  return {
    id: num(r.id),
    recipientRole: r.recipient_role ?? r.recipientRole,
    recipientId: num(r.recipient_id ?? r.recipientId),
    title: r.title,
    body: r.body,
    read: Boolean(r.read),
    createdAt: r.created_at ?? r.createdAt,
  };
}

export interface ProfileView {
  id: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  available: boolean;
  rating: number;
  approvalStatus?: string;
  workshopName?: string;
  location?: string;
  specialization?: string;
  priceFrom?: number;
  createdAt?: string;
}

export function normalizeProfile(r: Row): ProfileView {
  return {
    id: num(r.id),
    name: r.name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    skills: r.skills ?? '',
    available: Boolean(r.available),
    rating: num(r.rating ?? 0),
    approvalStatus: r.approval_status ?? r.approvalStatus,
    workshopName: r.workshop_name ?? r.workshopName ?? '',
    location: r.location ?? '',
    specialization: r.specialization ?? '',
    priceFrom:
      r.price_from === null || r.price_from === undefined
        ? undefined
        : num(r.price_from ?? r.priceFrom),
    createdAt: r.created_at ?? r.createdAt,
  };
}
