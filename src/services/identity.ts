import { cookies, headers } from "next/headers";
import { prisma } from "@/db/client";
import { randomToken, sha256 } from "@/security/tokens";

const visitorCookie = "readiness_visitor";
const sessionCookie = "readiness_session";
const ownerCookie = "readiness_owner";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365
};

export async function getOrCreateIdentity(language: "EN" | "HI" = "EN") {
  const cookieStore = await cookies();
  let visitorKey = cookieStore.get(visitorCookie)?.value;
  let sessionKey = cookieStore.get(sessionCookie)?.value;
  let ownershipKey = cookieStore.get(ownerCookie)?.value;

  if (!visitorKey) {
    visitorKey = randomToken(24);
    cookieStore.set(visitorCookie, visitorKey, cookieOptions);
  }
  if (!sessionKey) {
    sessionKey = randomToken(24);
    cookieStore.set(sessionCookie, sessionKey, cookieOptions);
  }
  if (!ownershipKey) {
    ownershipKey = randomToken(32);
    cookieStore.set(ownerCookie, ownershipKey, cookieOptions);
  }

  const visitor = await prisma.visitor.upsert({
    where: { visitorKey: sha256(visitorKey) },
    update: { language },
    create: {
      visitorKey: sha256(visitorKey),
      language,
      acquisitionType: "DIRECT"
    }
  });

  const headerStore = await headers();
  await prisma.visitorSession.upsert({
    where: { sessionKey: sha256(sessionKey) },
    update: { lastSeenAt: new Date() },
    create: {
      visitorId: visitor.id,
      sessionKey: sha256(sessionKey),
      userAgent: headerStore.get("user-agent"),
      ipHash: sha256(headerStore.get("x-forwarded-for") ?? "local")
    }
  });

  return {
    visitor,
    sessionKeyHash: sha256(sessionKey),
    ownershipKey,
    ownershipKeyHash: sha256(ownershipKey)
  };
}

export async function getOwnershipHashFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const ownershipKey = cookieStore.get(ownerCookie)?.value;
  return ownershipKey ? sha256(ownershipKey) : null;
}

export async function getExistingIdentity() {
  const cookieStore = await cookies();
  const visitorKey = cookieStore.get(visitorCookie)?.value;
  const ownershipKey = cookieStore.get(ownerCookie)?.value;
  if (!visitorKey || !ownershipKey) return null;
  const visitor = await prisma.visitor.findUnique({ where: { visitorKey: sha256(visitorKey) } });
  if (!visitor) return null;
  return {
    visitor,
    ownershipKeyHash: sha256(ownershipKey)
  };
}
