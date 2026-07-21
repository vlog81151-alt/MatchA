export type Gender = "woman" | "man" | "non_binary" | "self_describe";

export type DatingIntent = "long_term" | "life_partner" | "casual" | "friendship" | "figuring_out";

export type VerificationStatus = "unverified" | "photo_verified" | "id_verified" | "manual_review";

export type MatchAction = "pass" | "like" | "super_like" | "undo";

export type InstantDateVibe = "coffee" | "dinner" | "walk" | "drive" | "art" | "market" | "casual";

export type InstantDateWindow = "now" | "tonight" | "weekend" | "custom";

export type ConcertIntent = "concert_buddy" | "new_friends" | "maybe_more";

export type AppRoute =
  | "/"
  | "/login"
  | "/signup"
  | "/onboarding"
  | "/home"
  | "/matches"
  | "/chats"
  | "/aura"
  | "/profile"
  | "/instant-date"
  | "/concert-mode"
  | "/events";

export interface PublicProfileSummary {
  id: string;
  name: string;
  age: number;
  profession: string;
  city: string;
  bio: string;
  compatibilityScore: number;
  verificationStatus: VerificationStatus;
  interests: string[];
  photos: string[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export interface AuthenticatedUser {
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  name: string | null;
  profileCompletion: number;
  role: string;
  verificationStatus: string;
}

export interface AuthTokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthSessionResponse {
  tokens: AuthTokenPair;
  user: AuthenticatedUser;
}

export interface ProfilePhotoDto {
  blurHash: string | null;
  createdAt: string;
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  status: string;
  url: string;
}

export interface ProfileInterestDto {
  category: string;
  id: string;
  name: string;
}

export interface MatchaProfileDto {
  age: number | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  drinking: string | null;
  education: string | null;
  email: string;
  food: string[];
  gender: string | null;
  heightCm: number | null;
  id: string;
  interestedIn: string[];
  interests: ProfileInterestDto[];
  languages: string[];
  latitude: string | null;
  lifestyle: unknown;
  longitude: string | null;
  music: string[];
  name: string | null;
  pets: string | null;
  photos: ProfilePhotoDto[];
  profession: string | null;
  profileCompletion: number;
  promptAnswers: unknown;
  relationshipGoal: string | null;
  religion: string | null;
  smoking: string | null;
  state: string | null;
  travel: string[];
  verificationStatus: string;
}

export interface ProfileResponse {
  profile: MatchaProfileDto;
}
