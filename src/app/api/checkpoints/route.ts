import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/config/env";
import { prisma } from "@/db/client";
import { getOrCreateIdentity } from "@/services/identity";
import { createCheckpoint } from "@/services/assessments";
import { CalendarReminderProvider, WhatsAppSelfShareProvider } from "@/services/reminders";

const bodySchema = z.object({
  assessmentId: z.string().min(1),
  days: z.union([z.literal(7), z.literal(10)]),
  slot: z.enum(["morning", "afternoon", "evening"])
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const identity = await getOrCreateIdentity();
  const assessment = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: body.assessmentId } });
  if (assessment.visitorId !== identity.visitor.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { checkpoint, signedToken } = await createCheckpoint({
    visitorId: identity.visitor.id,
    assessmentId: body.assessmentId,
    days: body.days,
    slot: body.slot
  });
  const nextUrl = `${env.APP_BASE_URL}/next/${signedToken}`;
  const reminder = await new CalendarReminderProvider().createReminder({
    title: `${assessment.examType.replaceAll("_", " ")} Readiness Check #${assessment.attemptNumber + 1}`,
    description: "Your next readiness checkpoint is ready.",
    dueAt: checkpoint.dueAt,
    continueUrl: nextUrl
  });
  const whatsappUrl = new WhatsAppSelfShareProvider().buildDeepLink({
    text: `My next readiness check is on ${checkpoint.dueAt.toDateString()}.\n\nContinue:\n${nextUrl}`
  });
  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(reminder.icsText)}`;
  return NextResponse.json({ nextUrl, googleUrl: reminder.googleUrl, icsUrl, whatsappUrl });
}
