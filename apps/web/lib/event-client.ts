import { buildSearchParams, requestJson } from "./http-client";

export type EventCategory =
  | "BOOK_CLUB"
  | "FOOD_FESTIVAL"
  | "COMEDY"
  | "MOVIE"
  | "WORKSHOP"
  | "COMMUNITY"
  | "CONCERT";

export type ParticipantStatus = "INTERESTED" | "JOINED" | "CANCELLED" | "REMOVED";

export interface EventProfile {
  age: number | null;
  city: string | null;
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

export interface EventParticipant {
  createdAt: string;
  profile: EventProfile;
  status: ParticipantStatus;
  userId: string;
}

export interface EventCard {
  attendeeCount: number;
  category: EventCategory;
  city: string;
  coverImage: string | null;
  createdAt: string;
  currentUserParticipation: {
    createdAt: string;
    status: ParticipantStatus;
  } | null;
  description: string;
  endsAt: string | null;
  id: string;
  isPublished: boolean;
  participantPreview: EventParticipant[];
  startsAt: string;
  statusCounts: Record<string, number>;
  title: string;
  updatedAt: string;
  venue: string;
}

function search(params: Record<string, string | number | undefined>): string {
  return buildSearchParams(params);
}

export function listEvents(params: {
  category?: EventCategory;
  city?: string;
  limit?: number;
  q?: string;
}): Promise<{ events: EventCard[] }> {
  return requestJson(`/events${search(params)}`);
}

export function listMyEvents(): Promise<{ events: EventCard[] }> {
  return requestJson("/events/my");
}

export function getEvent(id: string): Promise<{
  event: EventCard;
  participants: EventParticipant[];
}> {
  return requestJson(`/events/${id}`);
}

export function joinEvent(
  id: string,
  payload: { status?: "INTERESTED" | "JOINED" }
): Promise<{ participant: Omit<EventParticipant, "profile"> & { eventId: string } }> {
  return requestJson(`/events/${id}/join`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function inviteUserToEvent(
  id: string,
  payload: { message?: string; recipientUserId: string }
): Promise<{
  invitation: {
    eventId: string;
    id: string;
    recipientName: string | null;
    recipientUserId: string;
    status: "sent";
  };
}> {
  return requestJson(`/events/${id}/invite`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function cancelEventParticipation(
  id: string
): Promise<{ participant: Omit<EventParticipant, "profile"> & { eventId: string } }> {
  return requestJson(`/events/${id}/cancel`, {
    method: "POST"
  });
}
