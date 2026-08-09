import "server-only";

import { z } from "zod";

const supabaseAdminEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const publicApiEnvSchema = z.object({
  YOUTH_CENTER_API_KEY: z.string().min(1),
  YOUTH_CENTER_API_BASE_URL: z.url().default(
    "https://www.youthcenter.go.kr/opi",
  ),
  GOV24_API_KEY: z.string().min(1),
  GOV24_API_BASE_URL: z.url().default("https://api.odcloud.kr/api/gov24/v3"),
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
    GOV24_API_KEY: process.env.GOV24_API_KEY,
    GOV24_API_BASE_URL: process.env.GOV24_API_BASE_URL,
  });
}
