/**
 * Parent auth utilities — JWT session management for mobile parent login.
 *
 * Similar to child-auth.ts but for parent accounts.
 * Uses email + password authentication (bcrypt).
 * Reuses CHILD_AUTH_SECRET for JWT signing (same HS256 scheme).
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ─── Constants ───

export const PARENT_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Placeholder hashes that indicate Auth0-only users (no mobile password set)
const PLACEHOLDER_HASHES = new Set([
  "PLACEHOLDER_HASH_USE_AUTH0",
  "auth0",
]);

// ─── Password Hashing ───

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Reject placeholder hashes — these users haven't set a mobile password
  if (PLACEHOLDER_HASHES.has(hash)) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

// ─── JWT Session ───

function getSecret(): Uint8Array {
  // Reuse the same secret as child auth for simplicity
  const secret = process.env.CHILD_AUTH_SECRET;
  if (!secret) {
    throw new Error("CHILD_AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createParentSession(
  parentId: string
): Promise<string> {
  return new SignJWT({ parentId, role: "parent" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyParentSession(
  token: string
): Promise<{ parentId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.parentId === "string" && payload.role === "parent") {
      return { parentId: payload.parentId };
    }
    return null;
  } catch {
    return null;
  }
}
