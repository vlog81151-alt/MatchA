import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  getMatches,
  getMatchingFilters,
  getRecommendations,
  likeUser,
  passUser,
  undoLastAction,
  updateMatchingFilters
} from "../matching/matching.service.js";
import {
  likeActionSchema,
  matchActionSchema,
  matchingFiltersSchema,
  recommendationQuerySchema
} from "../matching/matching.schemas.js";

export const matchingRouter: ExpressRouter = Router();

function currentUserId(request: Request): string {
  if (!request.user?.id) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return request.user.id;
}

matchingRouter.use(requireAuth);

matchingRouter.get(
  "/recommendations",
  validateQuery(recommendationQuerySchema),
  asyncHandler(async (request, response) => {
    const query = recommendationQuerySchema.parse(request.query);

    response.json(await getRecommendations(currentUserId(request), query));
  })
);

matchingRouter.post(
  "/like",
  validateBody(likeActionSchema),
  asyncHandler(async (request, response) => {
    const body = likeActionSchema.parse(request.body);

    response.status(201).json(await likeUser(currentUserId(request), body));
  })
);

matchingRouter.post(
  "/pass",
  validateBody(matchActionSchema),
  asyncHandler(async (request, response) => {
    const body = matchActionSchema.parse(request.body);

    response.status(201).json(await passUser(currentUserId(request), body));
  })
);

matchingRouter.post(
  "/undo",
  asyncHandler(async (request, response) => {
    response.json(await undoLastAction(currentUserId(request)));
  })
);

matchingRouter.get(
  "/matches",
  asyncHandler(async (request, response) => {
    response.json(await getMatches(currentUserId(request)));
  })
);

matchingRouter.get(
  "/filters",
  asyncHandler(async (request, response) => {
    response.json(await getMatchingFilters(currentUserId(request)));
  })
);

matchingRouter.patch(
  "/filters",
  validateBody(matchingFiltersSchema),
  asyncHandler(async (request, response) => {
    const body = matchingFiltersSchema.parse(request.body);

    response.json(await updateMatchingFilters(currentUserId(request), body));
  })
);
