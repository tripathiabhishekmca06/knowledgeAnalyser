import { addDays, addHours } from "date-fns";
import { prisma } from "@/db/client";
import { getOrCreateQuestionSet } from "@/services/question-sets";
import { trackEvent } from "@/services/analytics";
import { randomToken, sha256, signCheckpointPayload, verifyCheckpointToken } from "@/security/tokens";
import { shuffleWithSeed } from "@/utils/shuffle";
import { scoreAssessment } from "@/services/scoring";

export async function createAssessment(input: {
  visitorId: string;
  ownershipKeyHash: string;
  campaignCode?: string | null;
  examType: string;
  stageCode: string;
  language: "EN" | "HI";
  acquisitionType?: "CAMPAIGN" | "SHARED_LINK" | "DIRECT";
  sharedFromAssessmentId?: string | null;
  avoidQuestionIds?: string[];
}) {
  const campaign = input.campaignCode
    ? await prisma.campaign.findUnique({ where: { code: input.campaignCode } })
    : null;
  const questionSet = await getOrCreateQuestionSet({
    examType: input.examType,
    stageCode: input.stageCode,
    language: input.language,
    avoidQuestionIds: input.avoidQuestionIds
  });
  const privateToken = randomToken();
  const orderedQuestions = shuffleWithSeed(questionSet.questions, privateToken).slice(0, 10);
  const presentedOrder = orderedQuestions.map((item, index) => {
    const options = item.question.options as { id: string; text: string }[];
    return {
      position: index + 1,
      questionId: item.questionId,
      optionOrder: shuffleWithSeed(options, `${privateToken}:${item.questionId}`).map((option) => option.id)
    };
  });

  const assessment = await prisma.assessmentSession.create({
    data: {
      privateTokenHash: sha256(privateToken),
      privateTokenPreview: privateToken.slice(0, 8),
      ownershipKeyHash: input.ownershipKeyHash,
      visitorId: input.visitorId,
      campaignId: campaign?.id,
      questionSetId: questionSet.id,
      examType: input.examType,
      stageCode: input.stageCode,
      language: input.language,
      acquisitionType: input.acquisitionType ?? (campaign ? "CAMPAIGN" : "DIRECT"),
      sharedFromAssessmentId: input.sharedFromAssessmentId,
      presentedOrder
    }
  });

  await prisma.questionSet.update({ where: { id: questionSet.id }, data: { usageCount: { increment: 1 } } });
  await trackEvent({
    eventType: "assessment_created",
    campaignId: campaign?.id,
    visitorId: input.visitorId,
    metadata: { examType: input.examType, stageCode: input.stageCode, language: input.language }
  });

  return { assessment, privateToken };
}

export async function getAssessmentByToken(privateToken: string, ownershipKeyHash: string | null) {
  const assessment = await prisma.assessmentSession.findUnique({
    where: { privateTokenHash: sha256(privateToken) },
    include: {
      answers: true,
      snapshots: true,
      questionSet: { include: { questions: { include: { question: true } } } },
      campaign: true
    }
  });
  if (!assessment) return { state: "missing" as const };
  const owns = ownershipKeyHash === assessment.ownershipKeyHash;
  if (!owns && assessment.status !== "CREATED") {
    return { state: "foreign_started" as const, assessment };
  }
  if (assessment.status === "COMPLETED") {
    return { state: "completed" as const, assessment };
  }
  if (assessment.status === "CREATED" && owns) {
    await prisma.assessmentSession.update({
      where: { id: assessment.id },
      data: { status: "STARTED", startedAt: new Date() }
    });
    await trackEvent({
      eventType: "assessment_started",
      campaignId: assessment.campaignId,
      visitorId: assessment.visitorId
    });
  }
  return { state: "active" as const, assessment };
}

export async function saveAnswer(input: {
  privateToken: string;
  ownershipKeyHash: string;
  questionId: string;
  selectedOptionId: string;
  responseTimeMs: number;
}) {
  const assessment = await prisma.assessmentSession.findUniqueOrThrow({
    where: { privateTokenHash: sha256(input.privateToken) }
  });
  if (assessment.ownershipKeyHash !== input.ownershipKeyHash) throw new Error("ASSESSMENT_NOT_OWNED");
  if (assessment.status === "COMPLETED") throw new Error("ASSESSMENT_LOCKED");
  const order = assessment.presentedOrder as { questionId: string; optionOrder: string[] }[];
  const presented = order.find((item) => item.questionId === input.questionId);
  if (!presented) throw new Error("QUESTION_NOT_IN_ASSESSMENT");
  const answer = await prisma.assessmentAnswer.upsert({
    where: { assessmentId_questionId: { assessmentId: assessment.id, questionId: input.questionId } },
    update: {
      selectedOptionId: input.selectedOptionId,
      responseTimeMs: input.responseTimeMs,
      answeredAt: new Date()
    },
    create: {
      assessmentId: assessment.id,
      questionId: input.questionId,
      selectedOptionId: input.selectedOptionId,
      responseTimeMs: input.responseTimeMs,
      presentedOptions: presented.optionOrder
    }
  });
  await trackEvent({ eventType: "question_answered", visitorId: assessment.visitorId, campaignId: assessment.campaignId });
  return answer;
}

export async function submitAssessment(privateToken: string, ownershipKeyHash: string) {
  const assessment = await prisma.assessmentSession.findUniqueOrThrow({
    where: { privateTokenHash: sha256(privateToken) },
    include: {
      answers: { include: { question: true } },
      questionSet: true
    }
  });
  if (assessment.ownershipKeyHash !== ownershipKeyHash) throw new Error("ASSESSMENT_NOT_OWNED");
  if (assessment.status === "COMPLETED") {
    return prisma.readinessSnapshot.findUniqueOrThrow({ where: { assessmentId: assessment.id } });
  }
  const order = assessment.presentedOrder as { questionId: string }[];
  if (assessment.answers.length !== order.length) throw new Error("INCOMPLETE_ASSESSMENT");

  const profile = await prisma.scoringProfile.findFirstOrThrow({
    where: { examType: assessment.examType, stageCode: assessment.stageCode, active: true }
  });
  const scored = scoreAssessment({
    answers: assessment.answers,
    scoringProfile: profile,
    blueprintVersion: assessment.questionSet.blueprintVersion
  });

  return prisma.$transaction(async (tx) => {
    const completionClaim = await tx.assessmentSession.updateMany({
      where: { id: assessment.id, status: { not: "COMPLETED" } },
      data: { status: "COMPLETED", completedAt: new Date() }
    });
    if (completionClaim.count === 0) {
      return tx.readinessSnapshot.findUniqueOrThrow({ where: { assessmentId: assessment.id } });
    }
    await tx.assessmentAnswer.updateMany({ where: { assessmentId: assessment.id }, data: { locked: true } });
    const snapshot = await tx.readinessSnapshot.upsert({
      where: { assessmentId: assessment.id },
      update: {},
      create: {
        assessmentId: assessment.id,
        visitorId: assessment.visitorId,
        overallScore: scored.overallScore,
        rawCorrect: scored.rawCorrect,
        totalQuestions: scored.totalQuestions,
        dimensionScores: scored.dimensionScores,
        topicBreakdown: scored.topicBreakdown,
        skillBreakdown: scored.skillBreakdown,
        narrative: scored.narrative,
        scoringProfileId: profile.id,
        scoringProfileVersion: scored.scoringProfileVersion,
        blueprintVersion: scored.blueprintVersion
      }
    });
    await tx.campaignEvent.create({
      data: {
        eventType: "assessment_completed",
        campaignId: assessment.campaignId,
        visitorId: assessment.visitorId,
        metadata: { score: scored.overallScore }
      }
    });
    return snapshot;
  });
}

export async function createCheckpoint(input: {
  visitorId: string;
  assessmentId: string;
  days: 7 | 10;
  slot: "morning" | "afternoon" | "evening";
}) {
  const hour = input.slot === "morning" ? 8 : input.slot === "afternoon" ? 15 : 19;
  const due = addDays(new Date(), input.days);
  due.setHours(hour, 0, 0, 0);
  const rawReturnToken = randomToken();
  const checkpoint = await prisma.nextCheckpoint.create({
    data: {
      visitorId: input.visitorId,
      assessmentId: input.assessmentId,
      dueAt: due,
      preferredSlot: input.slot,
      returnTokenHash: sha256(rawReturnToken),
      tokenExpiresAt: addDays(due, 30)
    }
  });
  const signedToken = signCheckpointPayload({
    checkpointId: checkpoint.id,
    visitorId: input.visitorId,
    exp: Math.floor(addDays(due, 30).getTime() / 1000)
  });
  await trackEvent({ eventType: "calendar_reminder_created", visitorId: input.visitorId });
  return { checkpoint, signedToken };
}

export async function openCheckpoint(signedToken: string, ownershipKeyHash: string) {
  const payload = verifyCheckpointToken(signedToken);
  if (!payload) return { state: "invalid" as const };
  const checkpoint = await prisma.nextCheckpoint.findUnique({
    where: { id: payload.checkpointId },
    include: { assessment: { include: { answers: true } } }
  });
  if (!checkpoint || checkpoint.visitorId !== payload.visitorId) return { state: "invalid" as const };
  if (checkpoint.status === "CONSUMED") return { state: "consumed" as const, checkpoint };
  if (checkpoint.dueAt > addHours(new Date(), 1)) return { state: "not_ready" as const, checkpoint };

  const priorQuestions = checkpoint.assessment.answers.map((answer) => answer.questionId);
  const created = await createAssessment({
    visitorId: checkpoint.visitorId,
    ownershipKeyHash,
    campaignCode: undefined,
    examType: checkpoint.assessment.examType,
    stageCode: checkpoint.assessment.stageCode,
    language: checkpoint.assessment.language,
    acquisitionType: checkpoint.assessment.acquisitionType,
    avoidQuestionIds: priorQuestions
  });
  await prisma.nextCheckpoint.update({
    where: { id: checkpoint.id },
    data: { status: "CONSUMED", consumedAt: new Date() }
  });
  await trackEvent({ eventType: "next_checkpoint_opened", visitorId: checkpoint.visitorId });
  return { state: "created" as const, privateToken: created.privateToken };
}

export async function createShareLink(input: {
  visitorId: string;
  assessmentId: string;
  includeScore: boolean;
}) {
  const publicToken = randomToken();
  const assessment = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: input.assessmentId } });
  const link = await prisma.shareLink.create({
    data: {
      publicTokenHash: sha256(publicToken),
      publicTokenPreview: publicToken.slice(0, 8),
      visitorId: input.visitorId,
      assessmentId: input.assessmentId,
      campaignId: assessment.campaignId,
      includeScore: input.includeScore
    }
  });
  await trackEvent({ eventType: "share_link_created", visitorId: input.visitorId, campaignId: assessment.campaignId });
  return { link, publicToken };
}

export async function getShareByToken(publicToken: string) {
  return prisma.shareLink.findUnique({
    where: { publicTokenHash: sha256(publicToken) },
    include: {
      assessment: { include: { snapshots: true } },
      campaign: true
    }
  });
}
