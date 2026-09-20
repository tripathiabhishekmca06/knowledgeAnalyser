import { prisma } from "@/db/client";
import { requireAdmin } from "@/security/admin";
import { createCampaignAction } from "./actions";

export default async function CampaignAdminPage() {
  await requireAdmin();
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="shell stack">
      <h1>Campaigns</h1>
      <form action={createCampaignAction} className="panel stack">
        <h2>Create or update campaign</h2>
        <div className="grid">
          <label>
            Code
            <input name="code" defaultValue="UPSC-AZM-001" required />
          </label>
          <label>
            Name
            <input name="name" defaultValue="Azamgarh UPSC Readiness Pilot" required />
          </label>
          <label>
            Exam
            <input name="examType" defaultValue="UPSC_CSE" required />
          </label>
          <label>
            City
            <input name="city" defaultValue="Azamgarh" />
          </label>
          <label>
            Institution
            <input name="institution" placeholder="Optional" />
          </label>
          <label>
            Placement
            <input name="placement" defaultValue="Physical poster" />
          </label>
          <label>
            Poster/version
            <input name="posterId" defaultValue="UPSC-HI-V1" />
          </label>
          <label>
            Language
            <select name="languageHint" defaultValue="HI">
              <option value="HI">Hindi</option>
              <option value="EN">English</option>
            </select>
          </label>
          <label>
            Headline
            <input name="headlineVariant" defaultValue="UPSC_HI_V1" />
          </label>
          <label>
            Active
            <input name="active" type="checkbox" defaultChecked />
          </label>
        </div>
        <button type="submit">Save campaign</button>
      </form>
      <a className="button secondary" href="/api/admin/export/campaigns">
        Export CSV
      </a>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Exam</th>
            <th>City</th>
            <th>Placement</th>
            <th>Active</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td>{campaign.code}</td>
              <td>{campaign.examType}</td>
              <td>{campaign.city}</td>
              <td>{campaign.placement}</td>
              <td>{campaign.active ? "Yes" : "No"}</td>
              <td>
                <a href={`/api/admin/campaigns/${campaign.code}/qr?format=svg`}>SVG</a>{" "}
                <a href={`/api/admin/campaigns/${campaign.code}/qr?format=png`}>PNG</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
