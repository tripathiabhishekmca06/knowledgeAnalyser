import { prisma } from "@/db/client";
import { env, featureFlags } from "@/config/env";
import { requireAdmin } from "@/security/admin";

export default async function AiAdminPage() {
  await requireAdmin();
  const sinceHour = new Date(Date.now() - 60 * 60 * 1000);
  const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [hour, day, failures, generated, totalSets] = await Promise.all([
    prisma.aiUsage.count({ where: { createdAt: { gte: sinceHour }, success: true } }),
    prisma.aiUsage.count({ where: { createdAt: { gte: sinceDay }, success: true } }),
    prisma.aiUsage.count({ where: { success: false } }),
    prisma.questionSet.count({ where: { sourceType: "AI_GENERATED" } }),
    prisma.questionSet.count()
  ]);
  return (
    <main className="shell stack">
      <h1>AI</h1>
      <section className="grid">
        <div className="panel">AI enabled: {String(env.AI_ENABLED)}</div>
        <div className="panel">Kill switch: {String(env.AI_GLOBAL_KILL_SWITCH)}</div>
        <div className="panel">Generations hour: {hour}</div>
        <div className="panel">Generations today: {day}</div>
        <div className="panel">Failures: {failures}</div>
        <div className="panel">Question sets generated: {generated}</div>
        <div className="panel">Cache hit ready sets: {totalSets}</div>
        <div className="panel">Current affairs: {String(featureFlags.currentAffairs)}</div>
      </section>
      <form className="panel">
        <button type="button" disabled>
          Manual generation requires AI provider credentials
        </button>
      </form>
    </main>
  );
}
