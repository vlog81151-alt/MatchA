import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { allowedCorsOrigins, env, isProduction } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { apiRouter } from "./routes/index.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
    })
  );
  app.use(compression());
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(
    cors({
      credentials: true,
      origin: allowedCorsOrigins
    })
  );
  if (isProduction) {
    app.use(
      rateLimit({
        handler: (request, response) => {
          response.status(429).json({
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Please wait a minute and try again.",
              requestId: request.id
            }
          });
        },
        legacyHeaders: false,
        limit: 120,
        standardHeaders: true,
        windowMs: 15 * 60 * 1000
      })
    );
  }
  app.use(
    express.json({
      limit: "1mb"
    })
  );

  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
