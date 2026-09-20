import Link from "next/link";
import { prisma } from "@/db/client";
import { trackEvent } from "@/services/analytics";
import { messages, type Locale } from "@/i18n/messages";

export default async function CampaignPage({ params }: { params: Promise<{ campaignCode: string }> }) {
  const { campaignCode } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { code: campaignCode } });
  const locale: Locale = campaign?.languageHint === "HI" ? "hi" : "en";
  if (campaign) {
    await trackEvent({ eventType: "qr_scan", campaignId: campaign.id });
    await trackEvent({ eventType: "landing_view", campaignId: campaign.id });
  }
  const copy = messages[locale];
  return (
    <main className="shell hero">
      <p className="pill">{campaign?.name ?? "Free readiness diagnostic"}</p>
      <h1>{copy.landingTitle}</h1>
      <p className="lead">{copy.landingSub}</p>
      <div>
        <Link className="button" href={`/onboarding?campaign=${encodeURIComponent(campaignCode)}`}>
          {copy.cta}
        </Link>
      </div>
      <ul className="trust">
        {(copy.trust as string[]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}
