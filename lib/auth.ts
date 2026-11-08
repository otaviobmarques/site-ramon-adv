import { cookies } from "next/headers";
import { safeEqual, sign } from "./crypto";

export const SESSION_COOKIE = "admin_session";
const SESSION_HOURS = 12;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
}

export function checkCredentials(username: string, password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const user = (process.env.ADMIN_USER || "Admin").toLowerCase();
  const userOk = safeEqual(username.trim().toLowerCase(), user);
  const passOk = safeEqual(password, expected);
  return userOk && passOk;
}

export function createSessionToken(): { token: string; maxAge: number } {
  const maxAge = SESSION_HOURS * 3600;
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const body = `admin.${exp}`;
  return { token: `${body}.${sign(body)}`, maxAge };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !adminConfigured()) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, sign(body))) return false;
  const exp = Number(body.split(".")[1]);
  return Number.isFinite(exp) && exp > Date.now() / 1000;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
