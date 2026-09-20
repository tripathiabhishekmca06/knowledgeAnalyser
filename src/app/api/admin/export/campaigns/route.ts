import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({ include: { events: true }, orderBy: { createdAt: "desc" } });
  const rows = [
    ["code", "name", "examType", "city", "institution", "placement", "qrScans", "starts", "completions"].join(","),
    ...campaigns.map((campaign) => {
      const count = (type: string) => campaign.events.filter((event) => event.eventType === type).length;
      return [
        campaign.code,
        campaign.name,
        campaign.examType ?? "",
        campaign.city ?? "",
        campaign.institution ?? "",
        campaign.placement ?? "",
        count("qr_scan"),
        count("assessment_started"),
        count("assessment_completed")
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",");
    })
  ].join("\n");
  return new NextResponse(rows, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="campaign-performance.csv"'
    }
  });
}
