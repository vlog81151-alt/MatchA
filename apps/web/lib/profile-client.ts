import { requestJson } from "./http-client";

export interface ProfilePhoto {
  blurHash: string | null;
  createdAt: string;
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  status: string;
  url: string;
}

export interface ProfileInterest {
  category: string;
  id: string;
  name: string;
}

export interface MatchaProfile {
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
  interests: ProfileInterest[];
  languages: string[];
  latitude: string | null;
  lifestyle: unknown;
  longitude: string | null;
  music: string[];
  name: string | null;
  pets: string | null;
  photos: ProfilePhoto[];
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

interface ProfileResponse {
  profile: MatchaProfile;
}

export type ProfileUploadPurpose = "PROFILE_PHOTO" | "VERIFICATION_EVIDENCE";

export interface CloudinaryUploadSignature {
  apiKey: string;
  cloudName: string;
  folder: string;
  maxFileSizeBytes: number;
  publicId: string;
  resourceType: "image";
  signature: string;
  timestamp: number;
  uploadUrl: string;
}

export interface ProfileUpdatePayload {
  age?: number;
  bio?: string;
  city?: string;
  country?: string;
  drinking?: string;
  education?: string;
  food?: string[];
  gender?: string;
  heightCm?: number;
  interestedIn?: string[];
  interests?: string[];
  languages?: string[];
  latitude?: number;
  lifestyle?: Record<string, string>;
  longitude?: number;
  music?: string[];
  name?: string;
  pets?: string;
  profession?: string;
  promptAnswers?: Record<string, string>;
  relationshipGoal?: string;
  religion?: string;
  smoking?: string;
  state?: string;
  travel?: string[];
}

async function requestProfile(
  path: string,
  options: RequestInit & { body?: BodyInit | null } = {}
): Promise<MatchaProfile> {
  const payload = await requestJson<ProfileResponse>(path, options, "Profile request failed");

  return payload.profile;
}

export function getProfile(): Promise<MatchaProfile> {
  return requestProfile("/profile/me");
}

export function updateProfile(payload: ProfileUpdatePayload): Promise<MatchaProfile> {
  return requestProfile("/profile/me", {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function addProfilePhoto(payload: {
  cloudinaryId?: string;
  isPrimary?: boolean;
  url: string;
}): Promise<MatchaProfile> {
  return requestProfile("/profile/photos", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function getProfilePhotoUploadSignature(
  payload: {
    purpose?: ProfileUploadPurpose;
  } = {}
): Promise<{ upload: CloudinaryUploadSignature }> {
  return requestJson("/profile/photos/upload-signature", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function setPrimaryPhoto(photoId: string): Promise<MatchaProfile> {
  return requestProfile(`/profile/photos/${photoId}/primary`, {
    method: "PATCH"
  });
}

export function deleteProfilePhoto(photoId: string): Promise<MatchaProfile> {
  return requestProfile(`/profile/photos/${photoId}`, {
    method: "DELETE"
  });
}

export function requestVerification(payload: {
  evidenceUrl: string;
  type: "GOVERNMENT_ID" | "PHOTO_SELFIE";
}): Promise<MatchaProfile> {
  return requestProfile("/profile/verification", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function routeAfterAuth(profileCompletion: number): string {
  return profileCompletion >= 85 ? "/home" : "/onboarding";
}
