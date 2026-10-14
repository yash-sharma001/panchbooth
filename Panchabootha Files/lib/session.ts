import type { NextRequest } from "next/server";
import { SESSION_COOKIE, sessionUser } from "./auth.js";

export interface SessionUser {
  id: string;
  name: string;
  guest: boolean;
}

export function userFromRequest(req: NextRequest): SessionUser | null {
  return sessionUser(req.cookies.get(SESSION_COOKIE)?.value) as SessionUser | null;
}

export function tokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export { SESSION_COOKIE };
