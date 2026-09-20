export const QUESTION_SET_PROMPT_VERSION = "PROMPT-V1";

export function buildQuestionSetPrompt(input: {
  examName: string;
  examType: string;
  stageCode: string;
  language: "EN" | "HI";
  sections: unknown;
  difficultyDistribution: unknown;
  skillDistribution: unknown;
  allowedTopics: string[];
}) {
  return `
You are a senior Indian competitive-exam question setter and reviewer.

Generate exactly 10 MCQs for ${input.examName} (${input.examType}), stage ${input.stageCode}.
Language: ${input.language === "HI" ? "Hindi" : "English"}.

Follow these constraints:
- Exactly four options per question with ids A, B, C, D.
- Exactly one correct answer.
- Follow the supplied sections, difficulty distribution, and skill distribution.
- Use only these topic codes: ${input.allowedTopics.join(", ")}.
- Avoid ambiguity, duplicate questions, duplicate answers, opinion-based political questions, ideological framing, fabricated court decisions, fabricated acts, fabricated constitutional provisions, fabricated government schemes, fabricated dates/statistics, and unsupported latest/current information.
- Provide a concise correct-answer explanation.
- Explain why wrong options are incorrect.
- Assign topic, subtopic, skill, difficulty 1-5, expected solve time, and model confidence.
- Return strict JSON only in this shape: {"questions":[...]}.

Sections: ${JSON.stringify(input.sections)}
Difficulty distribution: ${JSON.stringify(input.difficultyDistribution)}
Skill distribution: ${JSON.stringify(input.skillDistribution)}
`.trim();
}
