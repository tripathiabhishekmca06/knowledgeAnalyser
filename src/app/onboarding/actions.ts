"use server";

import { redirect } from "next/navigation";
import { getOrCreateIdentity } from "@/services/identity";
import { createAssessment } from "@/services/assessments";
import { trackEvent } from "@/services/analytics";

export async function startAssessmentAction(formData: FormData) {
  const language = formData.get("language") === "HI" ? "HI" : "EN";
  const examType = String(formData.get("examType") ?? "");
  const stageCode = String(formData.get("stageCode") ?? "");
  const campaignCode = String(formData.get("campaign") ?? "") || null;
  const identity = await getOrCreateIdentity(language);
  await trackEvent({ eventType: "onboarding_started", visitorId: identity.visitor.id });
  await trackEvent({ eventType: "exam_selected", visitorId: identity.visitor.id, metadata: { examType } });
  await trackEvent({ eventType: "stage_selected", visitorId: identity.visitor.id, metadata: { stageCode } });
  await trackEvent({ eventType: "language_selected", visitorId: identity.visitor.id, metadata: { language } });
  const created = await createAssessment({
    visitorId: identity.visitor.id,
    ownershipKeyHash: identity.ownershipKeyHash,
    campaignCode,
    examType,
    stageCode,
    language
  });
  redirect(`/a/${created.privateToken}`);
}
