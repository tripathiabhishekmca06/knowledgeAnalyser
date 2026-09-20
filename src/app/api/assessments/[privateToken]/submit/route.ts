import { NextResponse } from "next/server";
import { getOwnershipHashFromCookie } from "@/services/identity";
import { submitAssessment } from "@/services/assessments";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ privateToken: string }> }
) {
  const { privateToken } = await params;
  const ownershipKeyHash = await getOwnershipHashFromCookie();
  if (!ownershipKeyHash) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const snapshot = await submitAssessment(privateToken, ownershipKeyHash);
  return NextResponse.json({ snapshotId: snapshot.id, score: snapshot.overallScore });
}
