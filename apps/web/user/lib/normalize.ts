// The backend returns raw PostgreSQL rows in snake_case for several endpoints
// (SELECT *), while the shared-types are camelCase. These helpers normalize
// rows to the shared-types shape so the UI can rely on one convention.

import type {
  Vehicle,
  ServiceRequest,
  Payment,
  Issue,
  Notification,
  Mechanic,
  Review,
} from '@automate/shared-types';

type Row = Record<string, any>;

function num(v: any): number {
  return typeof v === 'number' ? v : Number(v);
}

export interface ServiceRequestView extends ServiceRequest {
  // Joined vehicle columns present on the /services list response.
  make?: string;
  model?: string;
  registrationNo?: string;
  /** Category name + icon, so a bike booking never renders as a car. */
  vehicleCategoryName?: string | null;
  vehicleCategoryIcon?: string | null;
}

function maybeNum(v: any): number | null {
  return v === null || v === undefined || v === '' ? null : num(v);
}

export function normalizeVehicle(r: Row): Vehicle {
  return {
    id: num(r.id),
    userId: num(r.user_id ?? r.userId),
    // Denormalized display text, kept in sync by the backend.
    make: r.make,
    model: r.model,
    year: num(r.year),
    registrationNo: r.registration_no ?? r.registrationNo,
    createdAt: r.created_at ?? r.createdAt,
    updatedAt: r.updated_at ?? r.updatedAt ?? null,

    // Master-data references. Null on rows that predate multi-vehicle support.
    vehicleTypeId: maybeNum(r.vehicle_type_id ?? r.vehicleTypeId),
    vehicleTypeName: r.vehicle_type_name ?? r.vehicleTypeName ?? null,
    vehicleTypeCode: r.vehicle_type_code ?? r.vehicleTypeCode ?? null,
    vehicleCategoryId: maybeNum(r.vehicle_category_id ?? r.vehicleCategoryId),
    vehicleCategoryName: r.vehicle_category_name ?? r.vehicleCategoryName ?? null,
    vehicleCategoryCode: r.vehicle_category_code ?? r.vehicleCategoryCode ?? null,
    vehicleCategoryIcon: r.vehicle_category_icon ?? r.vehicleCategoryIcon ?? null,
    manufacturerId: maybeNum(r.vehicle_manufacturer_id ?? r.manufacturerId),
    manufacturerName: r.manufacturer_name ?? r.manufacturerName ?? null,
    modelId: maybeNum(r.vehicle_model_id ?? r.modelId),
    modelName: r.model_name ?? r.modelName ?? null,
    variantId: maybeNum(r.vehicle_variant_id ?? r.variantId),
    variantName: r.variant_name ?? r.variantName ?? null,
    fuelTypeId: maybeNum(r.vehicle_fuel_type_id ?? r.fuelTypeId),
    fuelTypeName: r.fuel_type_name ?? r.fuelTypeName ?? null,
    fuelTypeCode: r.fuel_type_code ?? r.fuelTypeCode ?? null,
    isElectric: Boolean(r.is_electric ?? r.isElectric),

    customManufacturer: r.custom_manufacturer ?? r.customManufacturer ?? null,
    customModel: r.custom_model ?? r.customModel ?? null,
    customVariant: r.custom_variant ?? r.customVariant ?? null,
    nickname: r.nickname ?? null,
    isActive: r.is_active === undefined ? true : Boolean(r.is_active),
  };
}

export function normalizeService(r: Row): ServiceRequestView {
  return {
    id: num(r.id),
    userId: num(r.user_id ?? r.userId),
    vehicleId: num(r.vehicle_id ?? r.vehicleId),
    mechanicId:
      r.mechanic_id ?? r.mechanicId ?? null
        ? num(r.mechanic_id ?? r.mechanicId)
        : null,
    category: r.category,
    description: r.description,
    status: r.status,
    scheduledAt: r.scheduled_at ?? r.scheduledAt ?? null,
    price: r.price === null || r.price === undefined ? null : num(r.price),
    bookingRef: r.booking_ref ?? r.bookingRef ?? null,
    estimatedDuration: r.estimated_duration ?? r.estimatedDuration ?? null,
    rated: num(r.rated ?? 0),
    createdAt: r.created_at ?? r.createdAt,
    updatedAt: r.updated_at ?? r.updatedAt,
    make: r.make,
    model: r.model,
    registrationNo: r.registration_no ?? r.registrationNo,
    vehicleCategoryName: r.vehicle_category_name ?? r.vehicleCategoryName ?? null,
    vehicleCategoryIcon: r.vehicle_category_icon ?? r.vehicleCategoryIcon ?? null,
  };
}

export function normalizeMechanic(r: Row): Mechanic {
  return {
    id: num(r.id),
    name: r.name,
    email: r.email ?? '',
    phone: r.phone ?? '',
    skills: r.skills ?? '',
    available: Boolean(r.available),
    rating: num(r.rating ?? 0),
    createdAt: r.created_at ?? r.createdAt ?? '',
    workshopName: r.workshop_name ?? r.workshopName,
    location: r.location,
    specialization: r.specialization,
    priceFrom: r.price_from === null || r.price_from === undefined ? undefined : num(r.price_from),
    reviewsCount: r.reviews_count === null || r.reviews_count === undefined ? undefined : num(r.reviews_count),
    approvalStatus: r.approval_status ?? r.approvalStatus,
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

export function normalizePayment(r: Row): Payment {
  return {
    id: num(r.id),
    serviceRequestId: num(r.service_request_id ?? r.serviceRequestId),
    userId: num(r.user_id ?? r.userId),
    amount: num(r.amount),
    method: r.method,
    status: r.status,
    transactionRef: r.transaction_ref ?? r.transactionRef,
    createdAt: r.created_at ?? r.createdAt,
  };
}

export function normalizeIssue(r: Row): Issue {
  return {
    id: num(r.id),
    userId: num(r.user_id ?? r.userId),
    serviceRequestId:
      r.service_request_id ?? r.serviceRequestId ?? null
        ? num(r.service_request_id ?? r.serviceRequestId)
        : null,
    title: r.title,
    description: r.description,
    imagePath: r.image_path ?? r.imagePath ?? null,
    status: r.status,
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
