import Link from "next/link";
import { prisma } from "@/db/client";
import { requireAdmin } from "@/security/admin";

export default async function AdminHome() {
  await requireAdmin();
  const [
    qrScans,
    uniqueVisitors,
    starts,
    completions,
    reports,
    returns,
    secondAssessments,
    referrals
  ] = await Promise.all([
    prisma.campaignEvent.count({ where: { eventType: "qr_scan" } }),
    prisma.visitor.count(),
    prisma.campaignEvent.count({ where: { eventType: "assessment_started" } }),
    prisma.campaignEvent.count({ where: { eventType: "assessment_completed" } }),
    prisma.readinessSnapshot.count(),
    prisma.campaignEvent.count({ where: { eventType: "next_checkpoint_opened" } }),
    prisma.assessmentSession.count({ where: { attemptNumber: { gt: 1 } } }),
    prisma.visitor.count({ where: { acquisitionType: "SHARED_LINK" } })
  ]);
  const completionRate = starts === 0 ? 0 : Math.round((completions / starts) * 100);

  return (
    <main className="shell stack">
      <h1>Admin</h1>
      <nav className="grid">
        <Link className="button secondary" href="/admin/campaigns">
          Campaigns
        </Link>
        <Link className="button secondary" href="/admin/analytics">
          Analytics
        </Link>
        <Link className="button secondary" href="/admin/questions">
          Questions
        </Link>
        <Link className="button secondary" href="/admin/ai">
          AI
        </Link>
        <Link className="button secondary" href="/admin/system">
          System
        </Link>
      </nav>
      <section className="grid">
        {[
          ["QR scans", qrScans],
          ["Unique visitors", uniqueVisitors],
          ["Assessment starts", starts],
          ["Assessment completions", completions],
          ["Completion %", `${completionRate}%`],
          ["Reports viewed", reports],
          ["7/10-day returns", returns],
          ["Second assessments", secondAssessments],
          ["Share/referral acquisition", referrals]
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <strong>{label}</strong>
            <p className="score" style={{ fontSize: "2.3rem" }}>
              {value}
            </p>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>Funnel</h2>
        <p>Scan → Start → Complete → Return → Second Test → Paid later</p>
      </section>
    </main>
  );
}
