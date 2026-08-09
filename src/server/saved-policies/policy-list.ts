import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  savedPolicyPrioritySchema,
  savedPolicyStatusSchema,
} from "@/features/saved-policies/saved-policy-schema";

const savedPolicyRowSchema = z.object({
  policy_id: z.uuid(),
  status: savedPolicyStatusSchema,
  priority: savedPolicyPrioritySchema,
  memo: z.string().nullable(),
  outcome: z.enum(["selected", "rejected", "waitlisted", "cancelled"]).nullable(),
  result_date: z.iso.date().nullable(),
  result_memo: z.string().nullable(),
  updated_at: z.iso.datetime({ offset: true }),
  policies: z
    .object({
      id: z.uuid(),
      title: z.string(),
      summary: z.string().nullable(),
      support_content: z.string().nullable(),
      application_end_date: z.iso.date().nullable(),
      application_period_text: z.string().nullable(),
      is_rolling: z.boolean(),
      application_url: z.url().nullable(),
      category: z.enum([
        "jobs_startup",
        "housing",
        "education",
        "finance",
        "welfare_culture",
        "participation_rights",
        "other",
      ]),
      organization_name: z.string().nullable(),
      lifecycle_status: z.enum(["active", "inactive", "archived"]),
    })
    .nullable(),
});

export type SavedPolicyListItem = z.infer<typeof savedPolicyRowSchema>;

export type SavedPolicyListParams = Readonly<{
  priority?: string;
  status?: string;
}>;

export async function listSavedPolicies(
  client: SupabaseClient,
  params: SavedPolicyListParams = {},
): Promise<readonly SavedPolicyListItem[]> {
  let query = client
    .from("saved_policies")
    .select(
      "policy_id,status,priority,memo,outcome,result_date,result_memo,updated_at,policies(id,title,summary,support_content,application_end_date,application_period_text,is_rolling,application_url,category,organization_name,lifecycle_status)",
    )
    .order("updated_at", { ascending: false });

  const status = savedPolicyStatusSchema.safeParse(params.status);
  if (status.success) query = query.eq("status", status.data);

  const priority = savedPolicyPrioritySchema.safeParse(params.priority);
  if (priority.success) query = query.eq("priority", priority.data);

  const { data, error } = await query;
  if (error) throw new Error(`챙긴 정책을 불러오지 못했습니다: ${error.message}`);

  const parsed = z.array(savedPolicyRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("챙긴 정책 데이터 형식이 올바르지 않습니다");

  return parsed.data;
}
