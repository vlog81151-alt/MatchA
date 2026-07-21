import { createHash, randomUUID } from "node:crypto";

import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

export type CloudinaryUploadPurpose = "PROFILE_PHOTO" | "VERIFICATION_EVIDENCE";

const folderByPurpose: Record<CloudinaryUploadPurpose, string> = {
  PROFILE_PHOTO: "matcha/profile-photos",
  VERIFICATION_EVIDENCE: "matcha/verification"
};

function requireCloudinaryConfig() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new HttpError(
      503,
      "CLOUDINARY_NOT_CONFIGURED",
      "Cloudinary uploads are not configured for this environment"
    );
  }

  return {
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    cloudName: env.CLOUDINARY_CLOUD_NAME
  };
}

function signUploadParameters(
  parameters: Record<string, number | string>,
  apiSecret: string
): string {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export function createCloudinaryUploadSignature(userId: string, purpose: CloudinaryUploadPurpose) {
  const config = requireCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${folderByPurpose[purpose]}/${userId}`;
  const publicId = `${purpose.toLowerCase()}-${randomUUID()}`;
  const signedParameters = {
    folder,
    public_id: publicId,
    timestamp
  };

  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder,
    maxFileSizeBytes: 8_000_000,
    publicId,
    resourceType: "image",
    signature: signUploadParameters(signedParameters, config.apiSecret),
    timestamp,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`
  };
}
