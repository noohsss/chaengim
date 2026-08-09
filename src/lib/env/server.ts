import "server-only";

import { z } from "zod";

const supabaseAdminEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const publicApiEnvSchema = z.object({
  YOUTH_CENTER_API_KEY: z.string().min(1),
  YOUTH_CENTER_API_BASE_URL: z.url().default(
    "https://www.youthcenter.go.kr/go/ythip/getPlcy",
  ),
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1),
});

export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return supabaseAdminEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export type PublicApiEnv = z.infer<typeof publicApiEnvSchema>;

export function getPublicApiEnv(): PublicApiEnv {
  return publicApiEnvSchema.parse({
    YOUTH_CENTER_API_KEY: process.env.YOUTH_CENTER_API_KEY,
    YOUTH_CENTER_API_BASE_URL: process.env.YOUTH_CENTER_API_BASE_URL,
  });
}

export function getCronEnv(): { CRON_SECRET: string } {
  return cronEnvSchema.parse({ CRON_SECRET: process.env.CRON_SECRET });
}
