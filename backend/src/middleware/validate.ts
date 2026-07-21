import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validateBody(schema: ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    schema.parse(request.body);
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    schema.parse(request.query);
    next();
  };
}
