import { addDays, format } from "date-fns";
import { prisma } from "@/db/client";
import { questionSetCacheKey } from "@/domain/blueprints";
import { QUESTION_SET_PROMPT_VERSION, buildQuestionSetPrompt } from "@/ai/prompts/question-set-v1";
import { AiBudgetGuard, DisabledLlmProvider, recordAiUsage, type LlmProvider } from "@/services/ai";
import { validateGeneratedQuestionSet, type GeneratedQuestionSet } from "@/domain/questions";
import { env } from "@/config/env";

export type QuestionSetRequest = {
  examType: string;
  stageCode: string;
  language: "EN" | "HI";
  subjectProfile?: string;
  avoidQuestionIds?: string[];
};

export async function getOrCreateQuestionSet(
  request: QuestionSetRequest,
  provider: LlmProvider = new DisabledLlmProvider()
) {
  const blueprint = await prisma.examBlueprint.findFirstOrThrow({
    where: { examType: request.examType, stageCode: request.stageCode, active: true },
    orderBy: { createdAt: "desc" },
    include: { exam: true }
  });
  const cycle = format(new Date(), "yyyy-'W'II");
  const cacheKey = questionSetCacheKey({
    examType: request.examType,
    stageCode: request.stageCode,
    subjectProfile: request.subjectProfile,
    language: request.language,
    cycle,
    blueprintVersion: blueprint.version,
    promptVersion: QUESTION_SET_PROMPT_VERSION
  });

  const existing = await prisma.questionSet.findFirst({
    where: {
      cacheKey,
      active: true,
      validationStatus: "APPROVED",
      questions: request.avoidQuestionIds?.length
        ? { every: { questionId: { notIn: request.avoidQuestionIds } } }
        : undefined
    },
    include: { questions: { include: { question: true }, orderBy: { position: "asc" } } }
  });
  if (existing) {
    await prisma.questionSet.update({ where: { id: existing.id }, data: { usageCount: { increment: 1 } } });
    return existing;
  }

  const fallback = await findFallbackSet(request);
  if (!env.FEATURE_AI_QUESTIONS || !env.AI_ENABLED || env.AI_GLOBAL_KILL_SWITCH) {
    if (fallback) return fallback;
  }

  try {
    await new AiBudgetGuard().assertAllowed(cacheKey);
    const topics = await prisma.syllabusTopic.findMany({ where: { examType: request.examType, active: true } });
    const allowedTopics = topics.map((topic) => topic.code);
    const started = Date.now();
    const generated = await provider.generateQuestionSet({
      cacheKey,
      prompt: buildQuestionSetPrompt({
        examName: blueprint.exam.displayName,
        examType: request.examType,
        stageCode: request.stageCode,
        language: request.language,
        sections: blueprint.sections,
        difficultyDistribution: blueprint.difficultyDistribution,
        skillDistribution: blueprint.skillDistribution,
        allowedTopics
      })
    });
    const validation = validateGeneratedQuestionSet(generated, allowedTopics, request.language);
    if (!validation.ok) throw new Error(validation.errors.join("; "));
    const created = await persistGeneratedSet({
      data: validation.data,
      cacheKey,
      request,
      cycle,
      blueprintVersion: blueprint.version
    });
    await recordAiUsage({
      provider: env.AI_PROVIDER ?? "unknown",
      model: env.AI_MODEL ?? "unknown",
      purpose: "QUESTION_SET",
      cacheKey,
      promptVersion: QUESTION_SET_PROMPT_VERSION,
      success: true,
      latencyMs: Date.now() - started
    });
    return created;
  } catch (error) {
    await recordAiUsage({
      provider: env.AI_PROVIDER ?? "disabled",
      model: env.AI_MODEL ?? "none",
      purpose: "QUESTION_SET",
      cacheKey,
      promptVersion: QUESTION_SET_PROMPT_VERSION,
      success: false,
      failureType: error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN"
    });
    if (fallback) return fallback;
    throw new Error("NO_QUESTION_SET_AVAILABLE");
  }
}

async function findFallbackSet(request: QuestionSetRequest) {
  return prisma.questionSet.findFirst({
    where: {
      examType: request.examType,
      stageCode: request.stageCode,
      language: request.language,
      active: true,
      validationStatus: "APPROVED"
    },
    include: { questions: { include: { question: true }, orderBy: { position: "asc" } } },
    orderBy: [{ sourceType: "desc" }, { createdAt: "desc" }]
  });
}

async function persistGeneratedSet(input: {
  data: GeneratedQuestionSet;
  cacheKey: string;
  request: QuestionSetRequest;
  cycle: string;
  blueprintVersion: string;
}) {
  return prisma.$transaction(async (tx) => {
    const set = await tx.questionSet.create({
      data: {
        cacheKey: input.cacheKey,
        examType: input.request.examType,
        stageCode: input.request.stageCode,
        subjectProfile: input.request.subjectProfile ?? "GENERAL",
        language: input.request.language,
        cycle: input.cycle,
        blueprintVersion: input.blueprintVersion,
        promptVersion: QUESTION_SET_PROMPT_VERSION,
        generatorProvider: env.AI_PROVIDER,
        generatorModel: env.AI_MODEL,
        validationStatus: env.AUTO_APPROVE_AI_QUESTION_SETS ? "APPROVED" : "PENDING",
        generatedAt: new Date(),
        expiresAt: addDays(new Date(), env.QUESTION_SET_TTL_DAYS),
        sourceType: "AI_GENERATED"
      }
    });
    for (const [index, question] of input.data.questions.entries()) {
      const created = await tx.question.create({
        data: {
          sourceType: "AI_GENERATED",
          language: input.request.language,
          stem: question.stem,
          options: question.options,
          correctOptionId: question.correctOption,
          explanation: question.explanation,
          incorrectOptionExplanations: question.incorrectOptionExplanations,
          topicCode: question.topic,
          subtopic: question.subtopic,
          skill: question.skill,
          difficulty: question.difficulty,
          expectedSeconds: question.expectedSeconds,
          sourceContextIds: question.sourceContextIds ?? [],
          modelConfidence: question.modelConfidence
        }
      });
      await tx.questionSetQuestion.create({
        data: { questionSetId: set.id, questionId: created.id, position: index + 1 }
      });
    }
    return tx.questionSet.findUniqueOrThrow({
      where: { id: set.id },
      include: { questions: { include: { question: true }, orderBy: { position: "asc" } } }
    });
  });
}
