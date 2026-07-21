import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody } from "../middleware/validate.js";
import {
  addProfilePhoto,
  createProfilePhotoUploadSignature,
  deleteProfilePhoto,
  getProfile,
  requestProfileVerification,
  setPrimaryPhoto,
  updateProfile
} from "../profile/profile.service.js";
import {
  photoCreateSchema,
  photoUploadSignatureSchema,
  profileUpdateSchema,
  verificationRequestSchema
} from "../profile/profile.schemas.js";

export const profileRouter: ExpressRouter = Router();

function currentUserId(request: Request): string {
  if (!request.user?.id) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return request.user.id;
}

function routeParam(request: Request, key: string): string {
  const value = request.params[key];

  if (!value) {
    throw new HttpError(400, "ROUTE_PARAM_MISSING", `${key} is required`);
  }

  return value;
}

profileRouter.use(requireAuth);

profileRouter.get(
  "/me",
  asyncHandler(async (request, response) => {
    response.json({
      profile: await getProfile(currentUserId(request))
    });
  })
);

profileRouter.patch(
  "/me",
  validateBody(profileUpdateSchema),
  asyncHandler(async (request, response) => {
    const body = profileUpdateSchema.parse(request.body);

    response.json({
      profile: await updateProfile(currentUserId(request), body)
    });
  })
);

profileRouter.post(
  "/photos/upload-signature",
  validateBody(photoUploadSignatureSchema),
  asyncHandler(async (request, response) => {
    const body = photoUploadSignatureSchema.parse(request.body);

    response.json(await createProfilePhotoUploadSignature(currentUserId(request), body));
  })
);

profileRouter.post(
  "/photos",
  validateBody(photoCreateSchema),
  asyncHandler(async (request, response) => {
    const body = photoCreateSchema.parse(request.body);

    response.status(201).json({
      profile: await addProfilePhoto(currentUserId(request), body)
    });
  })
);

profileRouter.patch(
  "/photos/:photoId/primary",
  asyncHandler(async (request, response) => {
    response.json({
      profile: await setPrimaryPhoto(currentUserId(request), routeParam(request, "photoId"))
    });
  })
);

profileRouter.delete(
  "/photos/:photoId",
  asyncHandler(async (request, response) => {
    response.json({
      profile: await deleteProfilePhoto(currentUserId(request), routeParam(request, "photoId"))
    });
  })
);

profileRouter.post(
  "/verification",
  validateBody(verificationRequestSchema),
  asyncHandler(async (request, response) => {
    const body = verificationRequestSchema.parse(request.body);

    response.status(202).json({
      profile: await requestProfileVerification(currentUserId(request), body)
    });
  })
);
