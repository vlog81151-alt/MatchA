import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { isProduction } from "../config/env.js";
import { logger } from "../config/logger.js";
import { isHttpError } from "../lib/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        details: error.flatten(),
        message: "Request validation failed",
        requestId: request.id
      }
    });
    return;
  }

  if (isHttpError(error)) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        requestId: request.id
      }
    });
    return;
  }

  logger.error({ error, requestId: request.id }, "Unhandled API error");

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "Internal server error" : String(error),
      requestId: request.id
    }
  });
};
