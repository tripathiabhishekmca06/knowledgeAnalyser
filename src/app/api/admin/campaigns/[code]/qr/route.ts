import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { env } from "@/config/env";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const campaignUrl = `${env.APP_BASE_URL}/r/${encodeURIComponent(code)}`;
  if (format === "png") {
    const buffer = await QRCode.toBuffer(campaignUrl, { errorCorrectionLevel: "H", margin: 4, width: 1200 });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="${code}.png"`
      }
    });
  }
  const svg = await QRCode.toString(campaignUrl, { type: "svg", errorCorrectionLevel: "H", margin: 4 });
  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "content-disposition": `attachment; filename="${code}.svg"`
    }
  });
}
