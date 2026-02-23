import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ─── Constants ───

export const CHILD_SESSION_COOKIE = "aauti-child-session";
export const CHILD_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── PIN Hashing ───

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(
  pin: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ─── JWT Session ───

function getSecret(): Uint8Array {
  const secret = process.env.CHILD_AUTH_SECRET;
  if (!secret) {
    throw new Error("CHILD_AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createChildSession(
  studentId: string
): Promise<string> {
  return new SignJWT({ studentId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHILD_SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyChildSession(
  token: string
): Promise<{ studentId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.studentId === "string") {
      return { studentId: payload.studentId };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Rate Limiting (in-memory) ───

const loginAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(username: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const key = username.toLowerCase();
  const entry = loginAttempts.get(key);

  if (!entry) return { allowed: true };

  if (entry.lockedUntil > Date.now()) {
    return {
      allowed: false,
      retryAfterMs: entry.lockedUntil - Date.now(),
    };
  }

  // Lockout expired — reset
  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(username: string): void {
  const key = username.toLowerCase();
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }

  loginAttempts.set(key, entry);
}

export function clearAttempts(username: string): void {
  loginAttempts.delete(username.toLowerCase());
}

// ─── PIN Validation ───

const TRIVIAL_PINS = new Set([
  "0000", "1111", "2222", "3333", "4444",
  "5555", "6666", "7777", "8888", "9999",
  "1234", "4321", "0123", "3210",
]);

export function validatePin(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) {
    return "PIN must be exactly 4 digits";
  }
  if (TRIVIAL_PINS.has(pin)) {
    return "PIN is too simple. Please choose a less obvious combination.";
  }
  return null; // valid
}

// ─── Username Validation ───

export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 20) {
    return "Username must be 3-20 characters";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return null; // valid
}
