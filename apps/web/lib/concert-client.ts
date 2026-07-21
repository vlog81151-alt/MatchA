import { buildSearchParams, requestJson } from "./http-client";

export type ConcertIntent = "concert_buddy" | "new_friends" | "maybe_more" | "group_vibe";
export type ParticipantStatus = "INTERESTED" | "JOINED" | "CANCELLED" | "REMOVED";

export interface ConcertProfile {
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

export interface ConcertParticipant {
  createdAt: string;
  intent: ConcertIntent;
  profile: ConcertProfile;
  status: ParticipantStatus;
  userId: string;
}

export interface ConcertCard {
  artist: string;
  attendeeCount: number;
  city: string;
  coverImage: string | null;
  createdAt: string;
  currentUserParticipation: {
    createdAt: string;
    intent: ConcertIntent;
    status: ParticipantStatus;
  } | null;
  genreTags: string[];
  id: string;
  intentCounts: Record<string, number>;
  isPublished: boolean;
  participantPreview: ConcertParticipant[];
  startsAt: string;
  title: string;
  updatedAt: string;
  venue: string;
}

function search(params: Record<string, string | number | undefined>): string {
  return buildSearchParams(params);
}

export function listConcerts(params: {
  city?: string;
  genre?: string;
  limit?: number;
  q?: string;
}): Promise<{ concerts: ConcertCard[] }> {
  return requestJson(`/concerts${search(params)}`);
}

export function listMyConcerts(): Promise<{ concerts: ConcertCard[] }> {
  return requestJson("/concerts/my");
}

export function getConcert(id: string): Promise<{
  concert: ConcertCard;
  participants: ConcertParticipant[];
}> {
  return requestJson(`/concerts/${id}`);
}

export function joinConcert(
  id: string,
  payload: { intent: ConcertIntent; status?: "INTERESTED" | "JOINED" }
): Promise<{ participant: Omit<ConcertParticipant, "profile"> & { concertId: string } }> {
  return requestJson(`/concerts/${id}/join`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateConcertIntent(
  id: string,
  payload: { intent: ConcertIntent }
): Promise<{ participant: Omit<ConcertParticipant, "profile"> & { concertId: string } }> {
  return requestJson(`/concerts/${id}/intent`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function confirmConcertMeetup(
  id: string
): Promise<{ participant: Omit<ConcertParticipant, "profile"> & { concertId: string } }> {
  return requestJson(`/concerts/${id}/confirm`, {
    method: "POST"
  });
}

export function cancelConcertParticipation(
  id: string
): Promise<{ participant: Omit<ConcertParticipant, "profile"> & { concertId: string } }> {
  return requestJson(`/concerts/${id}/cancel`, {
    method: "POST"
  });
}
