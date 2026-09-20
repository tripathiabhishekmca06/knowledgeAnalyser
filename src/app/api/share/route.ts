import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/config/env";
import { getOrCreateIdentity } from "@/services/identity";
import { createShareLink } from "@/services/assessments";

const bodySchema = z.object({
  assessmentId: z.string().min(1),
  includeScore: z.boolean().default(false)
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const identity = await getOrCreateIdentity();
  const { publicToken } = await createShareLink({
    visitorId: identity.visitor.id,
    assessmentId: body.assessmentId,
    includeScore: body.includeScore
  });
  return NextResponse.json({ publicUrl: `${env.APP_BASE_URL}/s/${publicToken}` });
}
