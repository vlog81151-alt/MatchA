import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  cancelEventParticipation,
  getEvent,
  inviteUserToEvent,
  joinEvent,
  listEvents,
  listMyEvents
} from "../event/event.service.js";
import {
  eventInviteSchema,
  eventParticipationSchema,
  eventQuerySchema
} from "../event/event.schemas.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const eventRouter: ExpressRouter = Router();

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

eventRouter.use(requireAuth);

eventRouter.get(
  "/",
  validateQuery(eventQuerySchema),
  asyncHandler(async (request, response) => {
    const query = eventQuerySchema.parse(request.query);

    response.json(await listEvents(currentUserId(request), query));
  })
);

eventRouter.get(
  "/my",
  asyncHandler(async (request, response) => {
    response.json(await listMyEvents(currentUserId(request)));
  })
);

eventRouter.get(
  "/:eventId",
  asyncHandler(async (request, response) => {
    response.json(await getEvent(currentUserId(request), routeParam(request, "eventId")));
  })
);

eventRouter.post(
  "/:eventId/join",
  validateBody(eventParticipationSchema),
  asyncHandler(async (request, response) => {
    const body = eventParticipationSchema.parse(request.body);

    response
      .status(201)
      .json(await joinEvent(currentUserId(request), routeParam(request, "eventId"), body));
  })
);

eventRouter.post(
  "/:eventId/invite",
  validateBody(eventInviteSchema),
  asyncHandler(async (request, response) => {
    const body = eventInviteSchema.parse(request.body);

    response
      .status(201)
      .json(await inviteUserToEvent(currentUserId(request), routeParam(request, "eventId"), body));
  })
);

eventRouter.post(
  "/:eventId/cancel",
  asyncHandler(async (request, response) => {
    response.json(
      await cancelEventParticipation(currentUserId(request), routeParam(request, "eventId"))
    );
  })
);
