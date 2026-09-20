import { prisma } from "@/db/client";
import { messages } from "@/i18n/messages";
import { startAssessmentAction } from "./actions";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { campaign: campaignCode } = await searchParams;
  const [campaign, exams] = await Promise.all([
    campaignCode ? prisma.campaign.findUnique({ where: { code: campaignCode } }) : null,
    prisma.examCatalog.findMany({ where: { active: true }, include: { stages: { orderBy: { order: "asc" } } } })
  ]);
  const locale = campaign?.languageHint === "HI" ? "hi" : "en";
  const copy = messages[locale];
  const selectedExam = campaign?.examType ?? exams[0]?.examType;

  return (
    <main className="shell stack">
      <h1>{copy.cta}</h1>
      <form action={startAssessmentAction} className="panel stack">
        <input type="hidden" name="campaign" value={campaignCode ?? ""} />
        <label>
          {copy.exam}
          <select name="examType" defaultValue={selectedExam} required>
            {exams.map((exam) => (
              <option key={exam.examType} value={exam.examType}>
                {exam.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy.stage}
          <select name="stageCode" defaultValue={exams.find((exam) => exam.examType === selectedExam)?.stages[0]?.code} required>
            {exams.flatMap((exam) =>
              exam.stages.map((stage) => (
                <option key={`${exam.examType}:${stage.code}`} value={stage.code}>
                  {exam.displayName} - {locale === "hi" ? stage.labelHi : stage.labelEn}
                </option>
              ))
            )}
          </select>
        </label>
        <label>
          {copy.language}
          <select name="language" defaultValue={campaign?.languageHint ?? "EN"}>
            <option value="HI">हिन्दी</option>
            <option value="EN">English</option>
          </select>
        </label>
        <button type="submit">{copy.start}</button>
      </form>
    </main>
  );
}
