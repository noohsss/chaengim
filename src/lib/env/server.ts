import "server-only";

import { z } from "zod";

const supabaseAdminEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return supabaseAdminEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
