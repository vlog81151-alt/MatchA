import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  cancelConcertParticipation,
  confirmConcertMeetup,
  getConcert,
  joinConcert,
  listConcerts,
  listMyConcerts,
  updateConcertIntent
} from "../concert/concert.service.js";
import {
  concertIntentUpdateSchema,
  concertJoinSchema,
  concertQuerySchema
} from "../concert/concert.schemas.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const concertRouter: ExpressRouter = Router();

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

concertRouter.use(requireAuth);

concertRouter.get(
  "/",
  validateQuery(concertQuerySchema),
  asyncHandler(async (request, response) => {
    const query = concertQuerySchema.parse(request.query);

    response.json(await listConcerts(currentUserId(request), query));
  })
);

concertRouter.get(
  "/my",
  asyncHandler(async (request, response) => {
    response.json(await listMyConcerts(currentUserId(request)));
  })
);

concertRouter.get(
  "/:concertId",
  asyncHandler(async (request, response) => {
    response.json(await getConcert(currentUserId(request), routeParam(request, "concertId")));
  })
);

concertRouter.post(
  "/:concertId/join",
  validateBody(concertJoinSchema),
  asyncHandler(async (request, response) => {
    const body = concertJoinSchema.parse(request.body);

    response
      .status(201)
      .json(await joinConcert(currentUserId(request), routeParam(request, "concertId"), body));
  })
);

concertRouter.patch(
  "/:concertId/intent",
  validateBody(concertIntentUpdateSchema),
  asyncHandler(async (request, response) => {
    const body = concertIntentUpdateSchema.parse(request.body);

    response.json(
      await updateConcertIntent(currentUserId(request), routeParam(request, "concertId"), body)
    );
  })
);

concertRouter.post(
  "/:concertId/confirm",
  asyncHandler(async (request, response) => {
    response.json(
      await confirmConcertMeetup(currentUserId(request), routeParam(request, "concertId"))
    );
  })
);

concertRouter.post(
  "/:concertId/cancel",
  asyncHandler(async (request, response) => {
    response.json(
      await cancelConcertParticipation(currentUserId(request), routeParam(request, "concertId"))
    );
  })
);
