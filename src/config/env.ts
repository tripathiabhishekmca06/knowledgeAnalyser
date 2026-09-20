import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value === "true");

const intFromString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number.parseInt(value ?? "", 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const envSchema = z.object({
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  APP_DOMAIN: z.string().default("localhost:3000"),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().default("development-session-secret-change-me"),
  TOKEN_SIGNING_SECRET: z.string().default("development-token-secret-change-me"),
  ADMIN_SESSION_SECRET: z.string().default("development-admin-secret-change-me"),
  AI_PROVIDER: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_API_BASE_URL: z.string().optional(),
  AI_ENABLED: boolFromString.default(true),
  AI_GLOBAL_KILL_SWITCH: boolFromString.default(false),
  MAX_AI_GENERATIONS_PER_HOUR: intFromString(5),
  MAX_AI_GENERATIONS_PER_DAY: intFromString(20),
  AI_REQUEST_TIMEOUT_SECONDS: intFromString(25),
  AI_MAX_RETRIES: intFromString(1),
  QUESTION_SET_TTL_DAYS: intFromString(7),
  AI_SECOND_PASS_VALIDATION: boolFromString.default(false),
  AUTO_APPROVE_AI_QUESTION_SETS: boolFromString.default(false),
  FEATURE_AI_QUESTIONS: boolFromString.default(false),
  FEATURE_CURRENT_AFFAIRS: boolFromString.default(false),
  FEATURE_CALENDAR_REMINDER: boolFromString.default(true),
  FEATURE_WHATSAPP_SAVE: boolFromString.default(true),
  WHATSAPP_NUMBER: z.string().optional(),
  WHATSAPP_CLOUD_API_ENABLED: boolFromString.default(false),
  MAX_WHATSAPP_OUTBOUND_PER_DAY: intFromString(0),
  FEATURE_PUBLIC_RESULT_SHARE: boolFromString.default(true),
  FEATURE_PAYMENTS: boolFromString.default(false),
  FEATURE_SUBSCRIPTIONS: boolFromString.default(false)
});

export const env = envSchema.parse(process.env);

export const featureFlags = {
  aiQuestions: env.FEATURE_AI_QUESTIONS,
  currentAffairs: env.FEATURE_CURRENT_AFFAIRS,
  calendarReminder: env.FEATURE_CALENDAR_REMINDER,
  whatsappSelfSave: env.FEATURE_WHATSAPP_SAVE,
  whatsappCloudApi: env.WHATSAPP_CLOUD_API_ENABLED,
  publicSharing: env.FEATURE_PUBLIC_RESULT_SHARE,
  payments: env.FEATURE_PAYMENTS,
  subscriptions: env.FEATURE_SUBSCRIPTIONS
};
