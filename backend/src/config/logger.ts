import pino from "pino";

import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "otp",
      "token",
      "refreshToken"
    ],
    remove: true
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          options: {
            colorize: true,
            singleLine: true
          },
          target: "pino-pretty"
        }
      : undefined
});
