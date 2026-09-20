import { prisma } from "@/db/client";
import { requireAdmin } from "@/security/admin";

export default async function AnalyticsPage() {
  await requireAdmin();
  const byCampaign = await prisma.campaign.findMany({
    include: { events: true },
    orderBy: { createdAt: "desc" }
  });
  const aiCount = await prisma.aiUsage.count({ where: { success: true } });
  return (
    <main className="shell stack">
      <h1>Analytics</h1>
      <section className="panel">
        <p>AI generations: {aiCount}</p>
      </section>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Scans</th>
            <th>Starts</th>
            <th>Completions</th>
            <th>WhatsApp saves</th>
            <th>Calendar reminders</th>
          </tr>
        </thead>
        <tbody>
          {byCampaign.map((campaign) => {
            const count = (type: string) => campaign.events.filter((event) => event.eventType === type).length;
            return (
              <tr key={campaign.id}>
                <td>{campaign.code}</td>
                <td>{count("qr_scan")}</td>
                <td>{count("assessment_started")}</td>
                <td>{count("assessment_completed")}</td>
                <td>{count("whatsapp_save_clicked")}</td>
                <td>{count("calendar_reminder_created")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
