import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  adminBroadcastSchema,
  adminEventQuerySchema,
  adminListQuerySchema,
  adminPublishSchema,
  adminReportReviewSchema,
  adminUserActionSchema,
  adminVerificationReviewSchema
} from "../admin/admin.schemas.js";
import {
  banUser,
  broadcastNotification,
  deleteUser,
  getAdminDashboard,
  getAdminMe,
  listAdminConcerts,
  listAdminEvents,
  listAdminUsers,
  listAuditLogs,
  listReports,
  listVerifications,
  reviewReport,
  reviewVerification,
  unbanUser,
  updateConcertPublishState,
  updateEventPublishState
} from "../admin/admin.service.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const adminRouter: ExpressRouter = Router();

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

adminRouter.use(requireAuth);

adminRouter.get(
  "/me",
  asyncHandler(async (request, response) => {
    response.json(await getAdminMe(currentUserId(request)));
  })
);

adminRouter.get(
  "/dashboard",
  asyncHandler(async (request, response) => {
    response.json(await getAdminDashboard(currentUserId(request)));
  })
);

adminRouter.get(
  "/users",
  validateQuery(adminListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminListQuerySchema.parse(request.query);

    response.json(await listAdminUsers(currentUserId(request), query));
  })
);

adminRouter.patch(
  "/users/:userId/ban",
  validateBody(adminUserActionSchema),
  asyncHandler(async (request, response) => {
    const body = adminUserActionSchema.parse(request.body);

    response.json(await banUser(currentUserId(request), routeParam(request, "userId"), body));
  })
);

adminRouter.patch(
  "/users/:userId/unban",
  validateBody(adminUserActionSchema),
  asyncHandler(async (request, response) => {
    const body = adminUserActionSchema.parse(request.body);

    response.json(await unbanUser(currentUserId(request), routeParam(request, "userId"), body));
  })
);

adminRouter.delete(
  "/users/:userId",
  validateBody(adminUserActionSchema),
  asyncHandler(async (request, response) => {
    const body = adminUserActionSchema.parse(request.body);

    response.json(await deleteUser(currentUserId(request), routeParam(request, "userId"), body));
  })
);

adminRouter.get(
  "/reports",
  validateQuery(adminListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminListQuerySchema.parse(request.query);

    response.json(await listReports(currentUserId(request), query));
  })
);

adminRouter.patch(
  "/reports/:reportId",
  validateBody(adminReportReviewSchema),
  asyncHandler(async (request, response) => {
    const body = adminReportReviewSchema.parse(request.body);

    response.json(
      await reviewReport(currentUserId(request), routeParam(request, "reportId"), body)
    );
  })
);

adminRouter.get(
  "/verifications",
  validateQuery(adminListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminListQuerySchema.parse(request.query);

    response.json(await listVerifications(currentUserId(request), query));
  })
);

adminRouter.patch(
  "/verifications/:verificationId/review",
  validateBody(adminVerificationReviewSchema),
  asyncHandler(async (request, response) => {
    const body = adminVerificationReviewSchema.parse(request.body);

    response.json(
      await reviewVerification(currentUserId(request), routeParam(request, "verificationId"), body)
    );
  })
);

adminRouter.get(
  "/events",
  validateQuery(adminEventQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminEventQuerySchema.parse(request.query);

    response.json(await listAdminEvents(currentUserId(request), query));
  })
);

adminRouter.patch(
  "/events/:eventId/publish",
  validateBody(adminPublishSchema),
  asyncHandler(async (request, response) => {
    const body = adminPublishSchema.parse(request.body);

    response.json(
      await updateEventPublishState(currentUserId(request), routeParam(request, "eventId"), body)
    );
  })
);

adminRouter.get(
  "/concerts",
  validateQuery(adminListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminListQuerySchema.parse(request.query);

    response.json(await listAdminConcerts(currentUserId(request), query));
  })
);

adminRouter.patch(
  "/concerts/:concertId/publish",
  validateBody(adminPublishSchema),
  asyncHandler(async (request, response) => {
    const body = adminPublishSchema.parse(request.body);

    response.json(
      await updateConcertPublishState(
        currentUserId(request),
        routeParam(request, "concertId"),
        body
      )
    );
  })
);

adminRouter.post(
  "/broadcasts",
  validateBody(adminBroadcastSchema),
  asyncHandler(async (request, response) => {
    const body = adminBroadcastSchema.parse(request.body);

    response.status(201).json(await broadcastNotification(currentUserId(request), body));
  })
);

adminRouter.get(
  "/audit-logs",
  validateQuery(adminListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = adminListQuerySchema.parse(request.query);

    response.json(await listAuditLogs(currentUserId(request), query));
  })
);
