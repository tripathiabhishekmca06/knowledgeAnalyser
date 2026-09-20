export const defaultDifficultyDistribution = [
  { difficulty: 1, count: 2 },
  { difficulty: 2, count: 3 },
  { difficulty: 3, count: 3 },
  { difficulty: 4, count: 2 }
];

export const defaultSkillDistribution = [
  { skill: "RECALL", count: 2 },
  { skill: "CONCEPT", count: 2 },
  { skill: "APPLICATION", count: 2 },
  { skill: "ANALYSIS", count: 2 },
  { skill: "ELIMINATION", count: 1 },
  { skill: "REASONING", count: 1 }
];

export const defaultScoringDimensions = [
  { code: "foundation", label: "Knowledge/Foundation", weight: 30, skills: ["RECALL", "CONCEPT"] },
  { code: "conceptual", label: "Conceptual Understanding", weight: 20, skills: ["CONCEPT"] },
  { code: "application", label: "Application", weight: 20, skills: ["APPLICATION", "ANALYSIS"] },
  { code: "reasoning", label: "Elimination/Reasoning", weight: 15, skills: ["ELIMINATION", "REASONING"] },
  { code: "accuracy", label: "Accuracy", weight: 10, skills: ["RECALL", "CONCEPT", "APPLICATION", "ANALYSIS", "ELIMINATION", "REASONING"] },
  { code: "speed", label: "Speed", weight: 5, skills: ["RECALL", "CONCEPT", "APPLICATION", "ANALYSIS", "ELIMINATION", "REASONING"] }
];

export function buildBlueprintSections(topicCodes: string[]) {
  return topicCodes.slice(0, 10).map((topicCode, index) => ({
    topicCode,
    count: index < 10 % topicCodes.length ? 2 : 1
  }));
}

export function questionSetCacheKey(input: {
  examType: string;
  stageCode: string;
  subjectProfile?: string;
  language: "EN" | "HI";
  cycle: string;
  blueprintVersion: string;
  promptVersion: string;
}) {
  return [
    input.examType,
    input.stageCode,
    input.subjectProfile ?? "GENERAL",
    input.language,
    input.cycle,
    input.blueprintVersion,
    input.promptVersion
  ].join(":");
}
