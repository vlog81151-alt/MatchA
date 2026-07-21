import { buildSearchParams, requestJson } from "./http-client";

export type InstantDateActivity =
  | "COFFEE"
  | "DINNER"
  | "WALK"
  | "DRIVE"
  | "ART"
  | "MARKET"
  | "CASUAL";
export type InstantDateTimeWindow = "now" | "tonight" | "this_weekend" | "custom";
export type InstantDateStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "COMPLETED";

export interface InstantDateProfile {
  age: number | null;
  city: string | null;
  compatibilityScore: number;
  distanceKm: number | null;
  id: string;
  name: string | null;
  photos: Array<{
    id: string;
    isPrimary: boolean;
    status: string;
    url: string;
  }>;
  profession: string | null;
  verificationStatus: string;
}

export interface InstantDateCard {
  activity: InstantDateActivity;
  canAccept: boolean;
  canCancel: boolean;
  canReject: boolean;
  canReschedule: boolean;
  chatMatchId: string | null;
  createdAt: string;
  direction: "incoming" | "outgoing" | "open";
  id: string;
  latitude: number | null;
  longitude: number | null;
  participant: InstantDateProfile | null;
  proposedAt: string;
  requesterId: string;
  recipientId: string | null;
  status: InstantDateStatus;
  timeWindow: string;
  updatedAt: string;
  venue: string | null;
}

export interface InstantDateCreatePayload {
  activity: InstantDateActivity;
  latitude?: number;
  longitude?: number;
  proposedAt?: string;
  timeWindow: InstantDateTimeWindow;
  venue?: string;
}

export interface InstantDateReschedulePayload {
  latitude?: number;
  longitude?: number;
  proposedAt?: string;
  timeWindow?: InstantDateTimeWindow;
  venue?: string;
}

function search(params: Record<string, string | undefined>): string {
  return buildSearchParams(params);
}

export function listInstantDates(status = "active"): Promise<{ instantDates: InstantDateCard[] }> {
  return requestJson(`/instant-dates${search({ status })}`);
}

export function createInstantDate(
  payload: InstantDateCreatePayload
): Promise<{ instantDate: InstantDateCard }> {
  return requestJson("/instant-dates", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function acceptInstantDate(id: string): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/accept`, {
    method: "POST"
  });
}

export function rejectInstantDate(id: string): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/reject`, {
    method: "POST"
  });
}

export function cancelInstantDate(id: string): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/cancel`, {
    method: "POST"
  });
}

export function completeInstantDate(id: string): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/complete`, {
    method: "POST"
  });
}

export function rescheduleInstantDate(
  id: string,
  payload: InstantDateReschedulePayload
): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/reschedule`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function shareInstantDateLocation(
  id: string,
  payload: { latitude: number; longitude: number }
): Promise<{ instantDate: InstantDateCard }> {
  return requestJson(`/instant-dates/${id}/location`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}
