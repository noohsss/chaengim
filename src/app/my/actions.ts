"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  applicationOutcomeSchema,
  savedPolicyPrioritySchema,
  savedPolicyStatusSchema,
} from "@/features/saved-policies/saved-policy-schema";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();
const nullableTextSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().max(5000).nullable(),
);
const nullableDateSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.iso.date().nullable(),
);
const nullableOutcomeSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  applicationOutcomeSchema.nullable(),
);

const updateSavedPolicySchema = z.object({
  memo: nullableTextSchema,
  outcome: nullableOutcomeSchema,
  policyId: z.uuid(),
  priority: savedPolicyPrioritySchema,
  resultDate: nullableDateSchema,
  resultMemo: nullableTextSchema,
  status: savedPolicyStatusSchema,
}).superRefine((value, context) => {
  if (value.status === "result_recorded" && !value.outcome) {
    context.addIssue({
      code: "custom",
      message: "결과 기록 상태에는 신청 결과가 필요합니다",
      path: ["outcome"],
    });
  }
});

function pathWithStatus(path: string, status: string): string {
  const url = new URL(path, "https://chaengim.internal");
  url.searchParams.set("status", status);
  return `${url.pathname}${url.search}`;
}

export async function updateSavedPolicy(formData: FormData): Promise<never> {
  const input = updateSavedPolicySchema.safeParse({
    policyId: formData.get("policyId"),
    memo: formData.get("memo"),
    outcome: formData.get("outcome"),
    priority: formData.get("priority"),
    resultDate: formData.get("resultDate"),
    resultMemo: formData.get("resultMemo"),
    status: formData.get("status"),
  });
  const returnPath = getSafeNextPath(formData.get("returnPath"));

  if (!input.success) {
    const hasMissingOutcome = input.error.issues.some(
      (issue) => issue.path[0] === "outcome",
    );
    redirect(pathWithStatus(returnPath, hasMissingOutcome ? "result_required" : "invalid"));
  }

  const client = await createClient();
  const { data: claims, error: claimsError } = await client.auth.getClaims();
  if (claimsError || !userIdSchema.safeParse(claims?.claims.sub).success) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const changes = {
    memo: input.data.memo,
    outcome: input.data.status === "result_recorded" ? input.data.outcome : null,
    priority: input.data.priority,
    result_date: input.data.status === "result_recorded" ? input.data.resultDate : null,
    result_memo: input.data.status === "result_recorded" ? input.data.resultMemo : null,
    status: input.data.status,
  };
  const { error } = await client
    .from("saved_policies")
    .update(changes)
    .eq("policy_id", input.data.policyId)
    .select("policy_id")
    .single();

  if (error) {
    console.error("Saved policy field update failed", { code: error.code });
    redirect(pathWithStatus(returnPath, "update_failed"));
  }

  revalidatePath("/my");
  redirect(pathWithStatus(returnPath, "updated"));
}
