import crypto from "node:crypto";
import { env } from "@/config/env";

export function randomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export type SignedPayload = {
  checkpointId: string;
  visitorId: string;
  exp: number;
};

export function signCheckpointPayload(payload: SignedPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.TOKEN_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyCheckpointToken(token: string): SignedPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto
    .createHmac("sha256", env.TOKEN_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");
  if (!timingSafeEqual(signature, expected)) return null;
  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedPayload;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}
