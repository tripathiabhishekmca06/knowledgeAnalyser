"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db/client";
import { requireAdmin } from "@/security/admin";

const campaignSchema = z.object({
  code: z.string().min(3).max(80).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(160),
  examType: z.string().min(2).max(80),
  city: z.string().max(120).optional(),
  institution: z.string().max(160).optional(),
  placement: z.string().max(160).optional(),
  posterId: z.string().max(80).optional(),
  languageHint: z.enum(["HI", "EN"]),
  headlineVariant: z.string().max(80).optional(),
  active: z.boolean().default(true)
});

export async function createCampaignAction(formData: FormData) {
  await requireAdmin();
  const parsed = campaignSchema.parse({
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    examType: String(formData.get("examType") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim() || undefined,
    institution: String(formData.get("institution") ?? "").trim() || undefined,
    placement: String(formData.get("placement") ?? "").trim() || undefined,
    posterId: String(formData.get("posterId") ?? "").trim() || undefined,
    languageHint: formData.get("languageHint") === "EN" ? "EN" : "HI",
    headlineVariant: String(formData.get("headlineVariant") ?? "").trim() || undefined,
    active: formData.get("active") === "on"
  });
  await prisma.campaign.upsert({
    where: { code: parsed.code },
    update: parsed,
    create: {
      ...parsed,
      audienceType: "ASPIRANT",
      metadata: {
        acquisitionSource: "PHYSICAL_QR",
        posterVersion: parsed.posterId ?? null
      }
    }
  });
  revalidatePath("/admin/campaigns");
}
