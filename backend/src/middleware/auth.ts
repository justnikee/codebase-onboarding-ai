/**
 * User identity middleware.
 * Reads X-User-ID header (Supabase UUID set by the frontend after auth/sync)
 * and the GitHub Bearer token, attaching both to req for downstream handlers.
 */

import { Request, Response, NextFunction } from "express";

export function extractUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = (req.headers["x-user-id"] as string) || null;
  const authHeader = req.headers.authorization;
  const githubToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

  (req as any).userId = userId;
  (req as any).githubToken = githubToken;

  next();
}
