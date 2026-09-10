import { jwtSecret } from "../db.js";

function b64(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s);
}

export async function genSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return b64(salt);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return b64(new Uint8Array(bits));
}

export async function verifyPassword(
  password: string,
  salt: string,
  expected: string,
): Promise<boolean> {
  const actual = await hashPassword(password, salt);
  return actual === expected;
}

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  const { sign } = await import("hono/jwt");
  return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, jwtSecret, "HS256");
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, jwtSecret, "HS256");
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
