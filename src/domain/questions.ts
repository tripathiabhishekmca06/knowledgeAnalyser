import { z } from "zod";

export const optionIdSchema = z.enum(["A", "B", "C", "D"]);

export const generatedQuestionSchema = z.object({
  stem: z.string().min(12),
  options: z
    .array(z.object({ id: optionIdSchema, text: z.string().min(1) }))
    .length(4),
  correctOption: optionIdSchema,
  explanation: z.string().min(8),
  incorrectOptionExplanations: z
    .array(z.object({ option: optionIdSchema, reason: z.string().min(4) }))
    .min(3),
  topic: z.string().min(1),
  subtopic: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  skill: z.enum(["RECALL", "CONCEPT", "APPLICATION", "ANALYSIS", "ELIMINATION", "REASONING"]),
  expectedSeconds: z.number().int().min(20).max(300),
  sourceContextIds: z.array(z.string()).optional(),
  modelConfidence: z.number().min(0).max(1)
});

export const generatedQuestionSetSchema = z.object({
  questions: z.array(generatedQuestionSchema).length(10)
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedQuestionSet = z.infer<typeof generatedQuestionSetSchema>;

export function validateGeneratedQuestionSet(
  candidate: unknown,
  allowedTopics: string[],
  language: "EN" | "HI"
) {
  const parsed = generatedQuestionSetSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const errors: string[] = [];
  const stems = new Set<string>();
  const correctPattern = new Map<string, number>();

  parsed.data.questions.forEach((question, index) => {
    const normalizedStem = question.stem.trim().toLowerCase();
    if (stems.has(normalizedStem)) errors.push(`Duplicate stem at question ${index + 1}`);
    stems.add(normalizedStem);

    const optionTexts = new Set(question.options.map((option) => option.text.trim().toLowerCase()));
    if (optionTexts.size !== 4) errors.push(`Duplicate option at question ${index + 1}`);
    if (!question.options.some((option) => option.id === question.correctOption)) {
      errors.push(`Missing correct option at question ${index + 1}`);
    }
    if (!allowedTopics.includes(question.topic)) {
      errors.push(`Topic ${question.topic} is not allowed`);
    }
    correctPattern.set(question.correctOption, (correctPattern.get(question.correctOption) ?? 0) + 1);
    if (language === "HI" && /^[\x00-\x7F]+$/.test(question.stem)) {
      errors.push(`Hindi question ${index + 1} appears to be English-only`);
    }
  });

  if ([...correctPattern.values()].some((count) => count >= 8)) {
    errors.push("Suspicious correct-answer pattern");
  }

  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, data: parsed.data };
}
