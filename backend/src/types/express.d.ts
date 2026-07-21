import type { PublicAuthUser } from "../auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: PublicAuthUser;
    }
  }
}

export {};
