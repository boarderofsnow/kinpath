import { Request, Response, NextFunction } from "express";
import { createServerSupabaseClient } from "../lib/supabase";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail?: string;
  accessToken: string;
}

/**
 * Validates the Bearer JWT from Supabase Auth.
 * Attaches userId, userEmail, and accessToken to the request for downstream use.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as AuthenticatedRequest).userId = user.id;
  (req as AuthenticatedRequest).userEmail = user.email;
  (req as AuthenticatedRequest).accessToken = token;
  next();
}
