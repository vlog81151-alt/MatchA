import { Router, type Request, type Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  blockChatUser,
  deleteMessage,
  editMessage,
  listChats,
  listMessages,
  markDelivered,
  markRead,
  reportChat,
  sendMessage,
  updateChatSettings
} from "../chat/chat.service.js";
import {
  chatListQuerySchema,
  chatSettingsSchema,
  editMessageSchema,
  messageListQuerySchema,
  reportChatSchema,
  sendMessageSchema
} from "../chat/chat.schemas.js";

export const chatRouter: ExpressRouter = Router();

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

chatRouter.use(requireAuth);

chatRouter.get(
  "/",
  validateQuery(chatListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = chatListQuerySchema.parse(request.query);

    response.json(await listChats(currentUserId(request), query));
  })
);

chatRouter.get(
  "/:matchId/messages",
  validateQuery(messageListQuerySchema),
  asyncHandler(async (request, response) => {
    const query = messageListQuerySchema.parse(request.query);

    response.json(
      await listMessages(currentUserId(request), routeParam(request, "matchId"), query)
    );
  })
);

chatRouter.post(
  "/:matchId/messages",
  validateBody(sendMessageSchema),
  asyncHandler(async (request, response) => {
    const body = sendMessageSchema.parse(request.body);

    response
      .status(201)
      .json(await sendMessage(currentUserId(request), routeParam(request, "matchId"), body));
  })
);

chatRouter.patch(
  "/:matchId/messages/:messageId",
  validateBody(editMessageSchema),
  asyncHandler(async (request, response) => {
    const body = editMessageSchema.parse(request.body);

    response.json(
      await editMessage(
        currentUserId(request),
        routeParam(request, "matchId"),
        routeParam(request, "messageId"),
        body
      )
    );
  })
);

chatRouter.delete(
  "/:matchId/messages/:messageId",
  asyncHandler(async (request, response) => {
    response.json(
      await deleteMessage(
        currentUserId(request),
        routeParam(request, "matchId"),
        routeParam(request, "messageId")
      )
    );
  })
);

chatRouter.post(
  "/:matchId/delivered",
  asyncHandler(async (request, response) => {
    response.json(await markDelivered(currentUserId(request), routeParam(request, "matchId")));
  })
);

chatRouter.post(
  "/:matchId/read",
  asyncHandler(async (request, response) => {
    response.json(await markRead(currentUserId(request), routeParam(request, "matchId")));
  })
);

chatRouter.patch(
  "/:matchId/settings",
  validateBody(chatSettingsSchema),
  asyncHandler(async (request, response) => {
    const body = chatSettingsSchema.parse(request.body);

    response.json(
      await updateChatSettings(currentUserId(request), routeParam(request, "matchId"), body)
    );
  })
);

chatRouter.post(
  "/:matchId/report",
  validateBody(reportChatSchema),
  asyncHandler(async (request, response) => {
    const body = reportChatSchema.parse(request.body);

    response
      .status(201)
      .json(await reportChat(currentUserId(request), routeParam(request, "matchId"), body));
  })
);

chatRouter.post(
  "/:matchId/block",
  asyncHandler(async (request, response) => {
    response
      .status(201)
      .json(await blockChatUser(currentUserId(request), routeParam(request, "matchId")));
  })
);
