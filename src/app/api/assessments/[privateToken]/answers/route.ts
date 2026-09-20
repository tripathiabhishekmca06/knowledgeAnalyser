import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnershipHashFromCookie } from "@/services/identity";
import { saveAnswer } from "@/services/assessments";

const bodySchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.enum(["A", "B", "C", "D"]),
  responseTimeMs: z.number().int().min(0).max(60 * 60 * 1000)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ privateToken: string }> }
) {
  const { privateToken } = await params;
  const ownershipKeyHash = await getOwnershipHashFromCookie();
  if (!ownershipKeyHash) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = bodySchema.parse(await request.json());
  await saveAnswer({ privateToken, ownershipKeyHash, ...body });
  return NextResponse.json({ ok: true });
}
