import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { HttpError } from "../lib/http-error.js";
import {
  deleteNotification,
  getNotificationPreferences,
  getUnreadNotificationCount,
  listPushTokens,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  revokePushToken,
  updateNotificationPreferences
} from "../notification/notification.service.js";
import {
  notificationPreferencesSchema,
  notificationQuerySchema,
  notificationReadAllSchema,
  pushTokenRegisterSchema,
  pushTokenRevokeSchema
} from "../notification/notification.schemas.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const notificationRouter: ExpressRouter = Router();

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

notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  validateQuery(notificationQuerySchema),
  asyncHandler(async (request, response) => {
    const query = notificationQuerySchema.parse(request.query);

    response.json(await listNotifications(currentUserId(request), query));
  })
);

notificationRouter.get(
  "/unread-count",
  asyncHandler(async (request, response) => {
    response.json(await getUnreadNotificationCount(currentUserId(request)));
  })
);

notificationRouter.get(
  "/preferences",
  asyncHandler(async (request, response) => {
    response.json(await getNotificationPreferences(currentUserId(request)));
  })
);

notificationRouter.patch(
  "/preferences",
  validateBody(notificationPreferencesSchema),
  asyncHandler(async (request, response) => {
    const body = notificationPreferencesSchema.parse(request.body);

    response.json(await updateNotificationPreferences(currentUserId(request), body));
  })
);

notificationRouter.patch(
  "/read-all",
  validateBody(notificationReadAllSchema),
  asyncHandler(async (request, response) => {
    const body = notificationReadAllSchema.parse(request.body);

    response.json(await markAllNotificationsRead(currentUserId(request), body));
  })
);

notificationRouter.get(
  "/push-tokens",
  asyncHandler(async (request, response) => {
    response.json(await listPushTokens(currentUserId(request)));
  })
);

notificationRouter.post(
  "/push-tokens",
  validateBody(pushTokenRegisterSchema),
  asyncHandler(async (request, response) => {
    const body = pushTokenRegisterSchema.parse(request.body);

    response.status(201).json(await registerPushToken(currentUserId(request), body));
  })
);

notificationRouter.post(
  "/push-tokens/revoke",
  validateBody(pushTokenRevokeSchema),
  asyncHandler(async (request, response) => {
    const body = pushTokenRevokeSchema.parse(request.body);

    response.json(await revokePushToken(currentUserId(request), body));
  })
);

notificationRouter.patch(
  "/:notificationId/read",
  asyncHandler(async (request, response) => {
    response.json(
      await markNotificationRead(currentUserId(request), routeParam(request, "notificationId"))
    );
  })
);

notificationRouter.delete(
  "/:notificationId",
  asyncHandler(async (request, response) => {
    response.json(
      await deleteNotification(currentUserId(request), routeParam(request, "notificationId"))
    );
  })
);
