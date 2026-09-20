import type { AssessmentAnswer, Question, ScoringProfile } from "@prisma/client";

type AnswerWithQuestion = AssessmentAnswer & { question: Question };

export function scoreAssessment(input: {
  answers: AnswerWithQuestion[];
  scoringProfile: ScoringProfile;
  blueprintVersion: string;
}) {
  const total = input.answers.length;
  const correct = input.answers.filter((answer) => answer.selectedOptionId === answer.question.correctOptionId).length;
  const dimensions = input.scoringProfile.dimensions as {
    code: string;
    label: string;
    weight: number;
    skills: string[];
  }[];

  const dimensionScores: Record<string, { label: string; score: number; weight: number }> = {};
  for (const dimension of dimensions) {
    const relevant =
      dimension.code === "speed"
        ? input.answers
        : input.answers.filter((answer) => dimension.skills.includes(answer.question.skill));
    const score =
      dimension.code === "speed"
        ? speedScore(relevant)
        : relevant.length === 0
          ? 0
          : Math.round(
              (relevant.filter((answer) => answer.selectedOptionId === answer.question.correctOptionId).length /
                relevant.length) *
                100
            );
    dimensionScores[dimension.code] = { label: dimension.label, score, weight: dimension.weight };
  }

  const overallScore = Math.round(
    Object.values(dimensionScores).reduce((sum, dimension) => sum + dimension.score * (dimension.weight / 100), 0)
  );

  return {
    overallScore,
    rawCorrect: correct,
    totalQuestions: total,
    dimensionScores,
    topicBreakdown: breakdown(input.answers, "topicCode"),
    skillBreakdown: breakdown(input.answers, "skill"),
    narrative: narrative(dimensionScores, overallScore),
    scoringProfileVersion: input.scoringProfile.version,
    blueprintVersion: input.blueprintVersion
  };
}

function speedScore(answers: AnswerWithQuestion[]) {
  if (answers.length === 0) return 0;
  const ratios = answers.map((answer) => {
    const actualSeconds = Math.max(1, Math.round(answer.responseTimeMs / 1000));
    return Math.min(1.2, answer.question.expectedSeconds / actualSeconds);
  });
  return Math.round(Math.min(100, (ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length) * 85));
}

function breakdown(answers: AnswerWithQuestion[], field: "topicCode" | "skill") {
  const groups: Record<string, { correct: number; total: number; score: number }> = {};
  for (const answer of answers) {
    const key = answer.question[field];
    groups[key] ??= { correct: 0, total: 0, score: 0 };
    groups[key].total += 1;
    if (answer.selectedOptionId === answer.question.correctOptionId) groups[key].correct += 1;
  }
  for (const group of Object.values(groups)) {
    group.score = Math.round((group.correct / group.total) * 100);
  }
  return groups;
}

function narrative(dimensions: Record<string, { label: string; score: number; weight: number }>, overallScore: number) {
  const sorted = Object.values(dimensions).sort((a, b) => b.score - a.score);
  const strongest = sorted[0]?.label ?? "Foundation";
  const improvement = sorted.at(-1)?.label ?? "Application";
  const insight =
    dimensions.foundation?.score >= 70 && dimensions.application?.score < 50
      ? "Your fundamentals appear stronger than your ability to apply them in exam-style questions."
      : overallScore >= 70
        ? "Your observed preparation strength is promising for this short diagnostic."
        : "Your snapshot shows clear room to improve with focused revision and practice.";
  return { strongest, improvement, insight };
}
