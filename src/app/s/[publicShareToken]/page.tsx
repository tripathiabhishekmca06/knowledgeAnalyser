import Link from "next/link";
import { getShareByToken } from "@/services/assessments";
import { trackEvent } from "@/services/analytics";

export default async function SharePage({ params }: { params: Promise<{ publicShareToken: string }> }) {
  const { publicShareToken } = await params;
  const share = await getShareByToken(publicShareToken);
  if (!share) {
    return (
      <main className="shell stack">
        <h1>Share link not found</h1>
        <Link className="button" href="/r/demo">
          Start My Free Readiness Check
        </Link>
      </main>
    );
  }
  await trackEvent({
    eventType: "share_link_opened",
    campaignId: share.campaignId,
    metadata: { shareLinkId: share.id, referrerAssessmentId: share.assessmentId }
  });
  const snapshot = share.assessment.snapshots[0];
  return (
    <main className="shell hero">
      <p className="pill">Shared readiness challenge</p>
      <h1>
        {share.includeScore && snapshot
          ? `An aspirant scored ${snapshot.overallScore}/100. Check your own readiness free.`
          : "An aspirant checked their government-exam readiness. Want to check yours?"}
      </h1>
      <p className="lead">10 questions. No login before the first assessment.</p>
      <Link className="button" href={`/onboarding?campaign=${share.campaign?.code ?? "demo"}`}>
        Start My Free Readiness Check
      </Link>
    </main>
  );
}
