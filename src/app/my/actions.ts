"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  savedPolicyPrioritySchema,
  savedPolicyStatusSchema,
} from "@/features/saved-policies/saved-policy-schema";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const editableStatusSchema = savedPolicyStatusSchema.extract([
  "interested",
  "reviewing",
  "planning_to_apply",
  "applied",
]);
const userIdSchema = z.uuid();

const updateSavedPolicySchema = z.object({
  policyId: z.uuid(),
  priority: savedPolicyPrioritySchema,
  status: editableStatusSchema.optional(),
});

function pathWithStatus(path: string, status: string): string {
  const url = new URL(path, "https://chaengim.internal");
  url.searchParams.set("status", status);
  return `${url.pathname}${url.search}`;
}

export async function updateSavedPolicy(formData: FormData): Promise<never> {
  const input = updateSavedPolicySchema.safeParse({
    policyId: formData.get("policyId"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });
  const returnPath = getSafeNextPath(formData.get("returnPath"));

  if (!input.success) redirect(pathWithStatus(returnPath, "invalid"));

  const client = await createClient();
  const { data: claims, error: claimsError } = await client.auth.getClaims();
  if (claimsError || !userIdSchema.safeParse(claims?.claims.sub).success) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const changes = {
    priority: input.data.priority,
    ...(input.data.status ? { status: input.data.status } : {}),
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
