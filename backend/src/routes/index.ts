import { Router, type Router as ExpressRouter } from "express";

import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { chatRouter } from "./chat.routes.js";
import { concertRouter } from "./concert.routes.js";
import { eventRouter } from "./event.routes.js";
import { healthRouter } from "./health.routes.js";
import { instantDateRouter } from "./instant-date.routes.js";
import { matchingRouter } from "./matching.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { profileRouter } from "./profile.routes.js";

export const apiRouter: ExpressRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/chats", chatRouter);
apiRouter.use("/concerts", concertRouter);
apiRouter.use("/events", eventRouter);
apiRouter.use("/instant-dates", instantDateRouter);
apiRouter.use("/matching", matchingRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/profile", profileRouter);
