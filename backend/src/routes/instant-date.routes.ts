import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  acceptInstantDate,
  cancelInstantDate,
  completeInstantDate,
  createInstantDate,
  listInstantDates,
  rejectInstantDate,
  rescheduleInstantDate,
  shareInstantDateLocation
} from "../instant-date/instant-date.service.js";
import {
  instantDateCreateSchema,
  instantDateQuerySchema,
  instantDateRescheduleSchema,
  liveLocationSchema
} from "../instant-date/instant-date.schemas.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const instantDateRouter: ExpressRouter = Router();

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

instantDateRouter.use(requireAuth);

instantDateRouter.get(
  "/",
  validateQuery(instantDateQuerySchema),
  asyncHandler(async (request, response) => {
    const query = instantDateQuerySchema.parse(request.query);

    response.json(await listInstantDates(currentUserId(request), query));
  })
);

instantDateRouter.post(
  "/",
  validateBody(instantDateCreateSchema),
  asyncHandler(async (request, response) => {
    const body = instantDateCreateSchema.parse(request.body);

    response.status(201).json(await createInstantDate(currentUserId(request), body));
  })
);

instantDateRouter.post(
  "/:instantDateId/accept",
  asyncHandler(async (request, response) => {
    response.json(
      await acceptInstantDate(currentUserId(request), routeParam(request, "instantDateId"))
    );
  })
);

instantDateRouter.post(
  "/:instantDateId/reject",
  asyncHandler(async (request, response) => {
    response.json(
      await rejectInstantDate(currentUserId(request), routeParam(request, "instantDateId"))
    );
  })
);

instantDateRouter.post(
  "/:instantDateId/cancel",
  asyncHandler(async (request, response) => {
    response.json(
      await cancelInstantDate(currentUserId(request), routeParam(request, "instantDateId"))
    );
  })
);

instantDateRouter.post(
  "/:instantDateId/complete",
  asyncHandler(async (request, response) => {
    response.json(
      await completeInstantDate(currentUserId(request), routeParam(request, "instantDateId"))
    );
  })
);

instantDateRouter.patch(
  "/:instantDateId/reschedule",
  validateBody(instantDateRescheduleSchema),
  asyncHandler(async (request, response) => {
    const body = instantDateRescheduleSchema.parse(request.body);

    response.json(
      await rescheduleInstantDate(
        currentUserId(request),
        routeParam(request, "instantDateId"),
        body
      )
    );
  })
);

instantDateRouter.patch(
  "/:instantDateId/location",
  validateBody(liveLocationSchema),
  asyncHandler(async (request, response) => {
    const body = liveLocationSchema.parse(request.body);

    response.json(
      await shareInstantDateLocation(
        currentUserId(request),
        routeParam(request, "instantDateId"),
        body
      )
    );
  })
);
