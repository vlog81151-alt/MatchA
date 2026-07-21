import { buildSearchParams, requestJson } from "./http-client";

export type LikeType = "LIKE" | "SUPER_LIKE";

export interface RecommendationPhoto {
  id: string;
  isPrimary: boolean;
  status: string;
  url: string;
}

export interface RecommendationInterest {
  category: string;
  id: string;
  name: string;
}

export interface RecommendationProfile {
  age: number | null;
  bio: string | null;
  city: string | null;
  compatibilityScore: number;
  distanceKm: number | null;
  gender: string | null;
  id: string;
  interests: RecommendationInterest[];
  name: string | null;
  photos: RecommendationPhoto[];
  profession: string | null;
  relationshipGoal: string | null;
  verificationStatus: string;
}

export interface RecommendationQuery {
  ageMax?: number;
  ageMin?: number;
  gender?: string;
  interest?: string;
  lifestyle?: string;
  limit?: number;
  maxDistanceKm?: number;
  profession?: string;
  relationshipGoal?: string;
  religion?: string;
}

export interface MatchingRecommendationsResponse {
  recommendations: RecommendationProfile[];
}

export interface MatchingFilters {
  maxAge: number;
  maxDistanceKm: number;
  minAge: number;
  showDistance: boolean;
}

export interface MatchingFiltersResponse {
  filters: MatchingFilters;
}

export interface MatchingActionResponse {
  action: LikeType | "PASS" | "UNDO_LIKE" | "UNDO_PASS";
  match?: {
    compatibilityScore: number;
    id: string;
    matchedAt: string;
    profile: RecommendationProfile;
  } | null;
  targetUserId: string;
}

export interface MatchCard {
  compatibilityScore: number;
  id: string;
  latestMessage: {
    body: string | null;
    createdAt: string;
    senderId: string;
    status: string;
    type: string;
  } | null;
  matchedAt: string;
  profile: RecommendationProfile;
  status: string;
}

export interface MatchesResponse {
  matches: MatchCard[];
}

function searchFromQuery(query: RecommendationQuery): string {
  return buildSearchParams(query);
}

export function getRecommendations(
  query: RecommendationQuery = {}
): Promise<MatchingRecommendationsResponse> {
  return requestJson<MatchingRecommendationsResponse>(
    `/matching/recommendations${searchFromQuery(query)}`
  );
}

export function likeProfile(targetUserId: string, type: LikeType): Promise<MatchingActionResponse> {
  return requestJson<MatchingActionResponse>("/matching/like", {
    body: JSON.stringify({
      targetUserId,
      type
    }),
    method: "POST"
  });
}

export function passProfile(targetUserId: string): Promise<MatchingActionResponse> {
  return requestJson<MatchingActionResponse>("/matching/pass", {
    body: JSON.stringify({
      targetUserId
    }),
    method: "POST"
  });
}

export function undoLastMatchingAction(): Promise<MatchingActionResponse> {
  return requestJson<MatchingActionResponse>("/matching/undo", {
    method: "POST"
  });
}

export function getMatches(): Promise<MatchesResponse> {
  return requestJson<MatchesResponse>("/matching/matches");
}

export function getMatchingFilters(): Promise<MatchingFiltersResponse> {
  return requestJson<MatchingFiltersResponse>("/matching/filters");
}

export function updateMatchingFilters(
  filters: Partial<MatchingFilters>
): Promise<MatchingFiltersResponse> {
  return requestJson<MatchingFiltersResponse>("/matching/filters", {
    body: JSON.stringify(filters),
    method: "PATCH"
  });
}
