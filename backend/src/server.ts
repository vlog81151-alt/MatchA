import { createServer } from "node:http";
import { Server } from "socket.io";

import { createApp } from "./app.js";
import { registerChatSocket } from "./chat/chat.socket.js";
import { allowedCorsOrigins, env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    credentials: true,
    origin: allowedCorsOrigins
  }
});

registerChatSocket(io);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `MatchA API listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info({ signal }, "Shutting down MatchA API");
  httpServer.close((error) => {
    if (error) {
      logger.error({ error }, "HTTP server shutdown failed");
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
