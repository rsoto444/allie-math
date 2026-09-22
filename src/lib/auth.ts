import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "allie_math_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days - this is a shared family device, not a bank

function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error("APP_SESSION_SECRET is not set. Add it to .env.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expiresAt = Number(payload);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function checkPin(pin: string): boolean {
  const expected = process.env.APP_PIN;
  if (!expected) {
    throw new Error("APP_PIN is not set. Add it to .env.");
  }
  const a = Buffer.from(pin.padEnd(16, " "));
  const b = Buffer.from(expected.padEnd(16, " "));
  return a.length === b.length && timingSafeEqual(a, b) && pin === expected;
}

/** Server Actions must call this themselves - Proxy alone is not enough (see Next.js data-security guide). */
export async function requireAuth(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("Not signed in.");
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
