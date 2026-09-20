import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { questionSetCacheKey } from "@/domain/blueprints";
import { validateGeneratedQuestionSet } from "@/domain/questions";
import { scoreAssessment } from "@/services/scoring";
import { shuffleWithSeed } from "@/utils/shuffle";
import { signCheckpointPayload, verifyCheckpointToken } from "@/security/tokens";

describe("core readiness behavior", () => {
  it("creates stable question set cache keys", () => {
    expect(
      questionSetCacheKey({
        examType: "UPSC_CSE",
        stageCode: "PRELIMS",
        language: "HI",
        cycle: "2026-W34",
        blueprintVersion: "BLUEPRINT-V1",
        promptVersion: "PROMPT-V1"
      })
    ).toBe("UPSC_CSE:PRELIMS:GENERAL:HI:2026-W34:BLUEPRINT-V1:PROMPT-V1");
  });

  it("preserves deterministic shuffled order by seed", () => {
    expect(shuffleWithSeed(["A", "B", "C", "D"], "token")).toEqual(
      shuffleWithSeed(["A", "B", "C", "D"], "token")
    );
  });

  it("rejects generated sets with duplicate options", () => {
    const bad = {
      questions: Array.from({ length: 10 }, (_, index) => ({
        stem: `Question ${index + 1} has enough text`,
        options: [
          { id: "A", text: "Same" },
          { id: "B", text: "Same" },
          { id: "C", text: "Different" },
          { id: "D", text: "Another" }
        ],
        correctOption: "A",
        explanation: "Because this is a seeded validation test.",
        incorrectOptionExplanations: [
          { option: "B", reason: "Wrong" },
          { option: "C", reason: "Wrong" },
          { option: "D", reason: "Wrong" }
        ],
        topic: "POLITY",
        skill: "RECALL",
        difficulty: 2,
        expectedSeconds: 60,
        modelConfidence: 0.8
      }))
    };
    expect(validateGeneratedQuestionSet(bad, ["POLITY"], "EN").ok).toBe(false);
  });

  it("scores deterministically without AI", () => {
    const answers = [
      answer("A", "A", "RECALL", "POLITY", 60_000, 60),
      answer("B", "A", "APPLICATION", "HISTORY", 90_000, 60)
    ];
    const result = scoreAssessment({
      answers,
      scoringProfile: {
        id: "score",
        examType: "UPSC_CSE",
        stageCode: "PRELIMS",
        version: "SCORE-V1",
        dimensions: [
          { code: "foundation", label: "Knowledge/Foundation", weight: 50, skills: ["RECALL"] },
          { code: "application", label: "Application", weight: 40, skills: ["APPLICATION"] },
          { code: "speed", label: "Speed", weight: 10, skills: ["RECALL", "APPLICATION"] }
        ],
        rules: {},
        active: true,
        createdAt: new Date()
      },
      blueprintVersion: "BLUEPRINT-V1"
    });
    expect(result.rawCorrect).toBe(1);
    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.overallScore).toBeLessThan(65);
  });

  it("verifies signed checkpoint tokens and rejects tampering", () => {
    const token = signCheckpointPayload({
      checkpointId: "checkpoint",
      visitorId: "visitor",
      exp: Math.floor(Date.now() / 1000) + 60
    });
    expect(verifyCheckpointToken(token)?.checkpointId).toBe("checkpoint");
    expect(verifyCheckpointToken(`${token}x`)).toBeNull();
  });
});

function answer(
  selectedOptionId: string,
  correctOptionId: string,
  skill: string,
  topicCode: string,
  responseTimeMs: number,
  expectedSeconds: number
) {
  return {
    id: crypto.randomUUID(),
    assessmentId: "assessment",
    questionId: crypto.randomUUID(),
    selectedOptionId,
    presentedOptions: [],
    responseTimeMs,
    answeredAt: new Date(),
    locked: false,
    question: {
      id: crypto.randomUUID(),
      sourceType: "FALLBACK" as const,
      language: "EN" as const,
      stem: "Question",
      options: [],
      correctOptionId,
      explanation: "Explanation",
      incorrectOptionExplanations: [],
      topicCode,
      subtopic: "Seed",
      skill,
      difficulty: 2,
      expectedSeconds,
      sourceContextIds: [],
      modelConfidence: 1,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}
