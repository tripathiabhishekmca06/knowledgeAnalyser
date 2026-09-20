import { prisma } from "@/db/client";
import { env } from "@/config/env";

export type GenerateQuestionSetRequest = {
  cacheKey: string;
  prompt: string;
};

export interface LlmProvider {
  generateQuestionSet(request: GenerateQuestionSetRequest): Promise<unknown>;
}

export class DisabledLlmProvider implements LlmProvider {
  async generateQuestionSet(): Promise<unknown> {
    throw new Error("AI_PROVIDER_DISABLED");
  }
}

export class AiBudgetGuard {
  async assertAllowed(cacheKey: string) {
    if (!env.AI_ENABLED || env.AI_GLOBAL_KILL_SWITCH || !env.FEATURE_AI_QUESTIONS) {
      throw new Error("AI_DISABLED");
    }
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [hourCount, dayCount] = await Promise.all([
      prisma.aiUsage.count({ where: { createdAt: { gte: hourAgo }, success: true } }),
      prisma.aiUsage.count({ where: { createdAt: { gte: dayAgo }, success: true } })
    ]);
    if (hourCount >= env.MAX_AI_GENERATIONS_PER_HOUR) throw new Error("AI_HOURLY_LIMIT");
    if (dayCount >= env.MAX_AI_GENERATIONS_PER_DAY) throw new Error("AI_DAILY_LIMIT");
    return cacheKey;
  }
}

export async function recordAiUsage(input: {
  provider: string;
  model: string;
  purpose: string;
  cacheKey?: string;
  promptVersion?: string;
  success: boolean;
  failureType?: string;
  latencyMs?: number;
}) {
  await prisma.aiUsage.create({
    data: {
      provider: input.provider,
      model: input.model,
      purpose: input.purpose,
      cacheKey: input.cacheKey,
      promptVersion: input.promptVersion,
      success: input.success,
      failureType: input.failureType,
      latencyMs: input.latencyMs ?? 0
    }
  });
}
