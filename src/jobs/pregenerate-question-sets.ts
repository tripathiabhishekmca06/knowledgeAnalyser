import { PrismaClient } from "@prisma/client";
import { getOrCreateQuestionSet } from "../services/question-sets";

const prisma = new PrismaClient();

const profiles = [
  ["UPSC_CSE", "PRELIMS", "HI"],
  ["UPSC_CSE", "PRELIMS", "EN"],
  ["UPPSC_PCS", "PRELIMS", "HI"],
  ["SSC_CGL", "TIER_1", "HI"],
  ["SSC_CGL", "TIER_1", "EN"],
  ["UPSSSC_PET", "GENERAL", "HI"],
  ["RRB_NTPC", "CBT_1", "HI"]
] as const;

for (const [examType, stageCode, language] of profiles) {
  await getOrCreateQuestionSet({ examType, stageCode, language });
  console.log(`Prepared ${examType}:${stageCode}:${language}`);
}

await prisma.$disconnect();
