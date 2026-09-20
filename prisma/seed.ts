import { PrismaClient, type Language } from "@prisma/client";
import { addDays, format } from "date-fns";
import { examSeeds } from "../src/domain/exams";
import {
  buildBlueprintSections,
  defaultDifficultyDistribution,
  defaultScoringDimensions,
  defaultSkillDistribution,
  questionSetCacheKey
} from "../src/domain/blueprints";
import { QUESTION_SET_PROMPT_VERSION } from "../src/ai/prompts/question-set-v1";

const prisma = new PrismaClient();

async function main() {
  for (const exam of examSeeds) {
    await prisma.examCatalog.upsert({
      where: { examType: exam.examType },
      update: { displayName: exam.displayName, active: true },
      create: { examType: exam.examType, displayName: exam.displayName }
    });

    for (const [index, stage] of exam.stages.entries()) {
      await prisma.examStage.upsert({
        where: { examType_code: { examType: exam.examType, code: stage.code } },
        update: { labelEn: stage.labelEn, labelHi: stage.labelHi, order: index },
        create: {
          examType: exam.examType,
          code: stage.code,
          labelEn: stage.labelEn,
          labelHi: stage.labelHi,
          order: index
        }
      });
    }

    for (const topic of exam.topics) {
      await prisma.syllabusTopic.upsert({
        where: { examType_code: { examType: exam.examType, code: topic.code } },
        update: { nameEn: topic.nameEn, nameHi: topic.nameHi, active: true },
        create: { examType: exam.examType, ...topic }
      });
    }

    for (const stage of exam.stages) {
      await prisma.scoringProfile.upsert({
        where: { examType_stageCode_version: { examType: exam.examType, stageCode: stage.code, version: "SCORE-V1" } },
        update: { dimensions: defaultScoringDimensions, active: true },
        create: {
          examType: exam.examType,
          stageCode: stage.code,
          version: "SCORE-V1",
          dimensions: defaultScoringDimensions,
          rules: {
            smallSampleCaution: true,
            noSelectionProbability: true
          }
        }
      });

      await prisma.examBlueprint.upsert({
        where: { examType_stageCode_version: { examType: exam.examType, stageCode: stage.code, version: "BLUEPRINT-V1" } },
        update: {
          questionCount: 10,
          sections: buildBlueprintSections(exam.topics.map((topic) => topic.code)),
          difficultyDistribution: defaultDifficultyDistribution,
          skillDistribution: defaultSkillDistribution,
          active: true
        },
        create: {
          examType: exam.examType,
          stageCode: stage.code,
          version: "BLUEPRINT-V1",
          questionCount: 10,
          sections: buildBlueprintSections(exam.topics.map((topic) => topic.code)),
          difficultyDistribution: defaultDifficultyDistribution,
          skillDistribution: defaultSkillDistribution,
          expectedDurationSeconds: exam.examType === "UPSC_CSE" ? 540 : 420
        }
      });

      await seedFallbackSet(exam, stage.code, "EN");
      await seedFallbackSet(exam, stage.code, "HI");
    }
  }

  await prisma.campaign.upsert({
    where: { code: "demo" },
    update: { active: true },
    create: {
      code: "demo",
      name: "Demo Readiness Campaign",
      examType: "UPSC_CSE",
      city: "Azamgarh",
      institution: "Demo",
      placement: "Local test",
      posterId: "000",
      audienceType: "ASPIRANT",
      languageHint: "HI",
      headlineVariant: "HOW_READY",
      active: true
    }
  });

  await prisma.campaign.upsert({
    where: { code: "UPSC-AZM-SHIBLI-GATE1-001" },
    update: { active: true },
    create: {
      code: "UPSC-AZM-SHIBLI-GATE1-001",
      name: "Shibli College Main Gate",
      examType: "UPSC_CSE",
      city: "Azamgarh",
      institution: "Shibli College",
      placement: "Main Gate",
      posterId: "001",
      audienceType: "ASPIRANT",
      languageHint: "HI",
      headlineVariant: "HOW_READY",
      active: true
    }
  });

  await prisma.campaign.upsert({
    where: { code: "UPSC-AZM-001" },
    update: {
      name: "Azamgarh UPSC Readiness Pilot",
      examType: "UPSC_CSE",
      city: "Azamgarh",
      languageHint: "HI",
      headlineVariant: "UPSC_HI_V1",
      active: true,
      metadata: {
        posterVersion: "UPSC-HI-V1",
        acquisitionSource: "PHYSICAL_QR"
      }
    },
    create: {
      code: "UPSC-AZM-001",
      name: "Azamgarh UPSC Readiness Pilot",
      examType: "UPSC_CSE",
      city: "Azamgarh",
      institution: "Pilot",
      placement: "Physical poster",
      posterId: "UPSC-HI-V1",
      audienceType: "ASPIRANT",
      languageHint: "HI",
      headlineVariant: "UPSC_HI_V1",
      active: true,
      metadata: {
        posterVersion: "UPSC-HI-V1",
        acquisitionSource: "PHYSICAL_QR"
      }
    }
  });
}

async function seedFallbackSet(
  exam: (typeof examSeeds)[number],
  stageCode: string,
  language: Language
) {
  const cycle = format(new Date(), "yyyy-'W'II");
  const cacheKey = questionSetCacheKey({
    examType: exam.examType,
    stageCode,
    language,
    cycle,
    blueprintVersion: "BLUEPRINT-V1",
    promptVersion: QUESTION_SET_PROMPT_VERSION
  });
  const set = await prisma.questionSet.upsert({
    where: { cacheKey },
    update: { active: true, validationStatus: "APPROVED" },
    create: {
      cacheKey,
      examType: exam.examType,
      stageCode,
      subjectProfile: "GENERAL",
      language,
      cycle,
      blueprintVersion: "BLUEPRINT-V1",
      promptVersion: QUESTION_SET_PROMPT_VERSION,
      validationStatus: "APPROVED",
      generatedAt: new Date(),
      expiresAt: addDays(new Date(), 30),
      active: true,
      sourceType: "FALLBACK",
      validationResults: { seed: true, nonProductionSample: true }
    }
  });

  const existing = await prisma.questionSetQuestion.count({ where: { questionSetId: set.id } });
  if (existing >= 10) return;

  await prisma.questionSetQuestion.deleteMany({ where: { questionSetId: set.id } });
  const skills = ["RECALL", "CONCEPT", "APPLICATION", "ANALYSIS", "ELIMINATION", "REASONING"];
  for (let index = 0; index < 10; index += 1) {
    const topic = exam.topics[index % exam.topics.length];
    const correct = ["A", "B", "C", "D"][index % 4];
    const question = await prisma.question.create({
      data: {
        sourceType: "FALLBACK",
        language,
        stem:
          language === "HI"
            ? `${exam.displayName} ${topic.nameHi} पर यह sample diagnostic प्रश्न ${index + 1} है. सही विकल्प चुनें.`
            : `This is sample diagnostic question ${index + 1} for ${exam.displayName} ${topic.nameEn}. Choose the best option.`,
        options: [
          { id: "A", text: language === "HI" ? "विकल्प A" : "Option A" },
          { id: "B", text: language === "HI" ? "विकल्प B" : "Option B" },
          { id: "C", text: language === "HI" ? "विकल्प C" : "Option C" },
          { id: "D", text: language === "HI" ? "विकल्प D" : "Option D" }
        ],
        correctOptionId: correct,
        explanation:
          language === "HI"
            ? "यह non-production seed explanation है जो local और AI-off flow को चलाने के लिए है."
            : "This non-production seed explanation keeps the local and AI-off flow operational.",
        incorrectOptionExplanations: [
          { option: "A", reason: "Seed option review." },
          { option: "B", reason: "Seed option review." },
          { option: "C", reason: "Seed option review." },
          { option: "D", reason: "Seed option review." }
        ],
        topicCode: topic.code,
        subtopic: "Seed",
        skill: skills[index % skills.length],
        difficulty: (index % 4) + 1,
        expectedSeconds: exam.examType === "UPSC_CSE" ? 75 : 55,
        sourceContextIds: [],
        modelConfidence: 1
      }
    });
    await prisma.questionSetQuestion.create({
      data: { questionSetId: set.id, questionId: question.id, position: index + 1 }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
