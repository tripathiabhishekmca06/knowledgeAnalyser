import { prisma } from "@/db/client";
import type { Prisma } from "@prisma/client";

export async function trackEvent(input: {
  eventType: string;
  campaignId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.campaignEvent.create({
    data: {
      eventType: input.eventType,
      campaignId: input.campaignId ?? null,
      visitorId: input.visitorId ?? null,
      sessionId: input.sessionId ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
    }
  });
}
