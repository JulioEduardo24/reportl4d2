import { cookies } from "next/headers";
import crypto from "crypto";

// Lightweight signed-cookie session for the logged-in reporter.
// Steam has no OAuth, so we can't rely on Supabase Auth's social providers;
// instead we verify Steam's OpenID assertion ourselves (lib/steam.ts) and
// then mint our own HMAC-signed cookie that just carries the SteamID.
const COOKIE_NAME = "reportl4d2_session";

function getSecret() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error("APP_SESSION_SECRET is not set. Add it to your .env.local");
  }
  return secret;
}

function sign(value: string) {
  const hmac = crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const hmac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected)) ? value : null;
}

export function setSessionCookie(steamId: string) {
  cookies().set(COOKIE_NAME, sign(steamId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getSessionSteamId(): string | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return unsign(raw);
}
