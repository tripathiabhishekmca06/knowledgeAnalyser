import { prisma } from "@/db/client";
import { env, featureFlags } from "@/config/env";
import { requireAdmin } from "@/security/admin";

export default async function SystemPage() {
  await requireAdmin();
  let database = "ready";
  try {
    await prisma.$queryRaw`select 1`;
  } catch {
    database = "down";
  }
  return (
    <main className="shell stack">
      <h1>System</h1>
      <section className="grid">
        <div className="panel">App version: 0.1.0</div>
        <div className="panel">Database: {database}</div>
        <div className="panel">AI enabled: {String(env.AI_ENABLED)}</div>
        <div className="panel">WhatsApp API: {String(featureFlags.whatsappCloudApi)}</div>
        <div className="panel">Payments: {String(featureFlags.payments)}</div>
        <div className="panel">Last backup: check server backup directory</div>
      </section>
    </main>
  );
}
