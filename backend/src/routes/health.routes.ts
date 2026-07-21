import { Router, type Router as ExpressRouter } from "express";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({
    service: "matcha-api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

healthRouter.get("/ready", (_request, response) => {
  response.json({
    checks: {
      api: "ok"
    },
    service: "matcha-api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});
