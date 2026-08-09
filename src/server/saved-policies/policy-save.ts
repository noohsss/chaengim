import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const userIdSchema = z.uuid();
const policyIdSchema = z.uuid();

export class SavedPolicyError extends Error {
  constructor(
    message: string,
    readonly code: "authentication_required" | "database_error" | "invalid_policy",
  ) {
    super(message);
    this.name = "SavedPolicyError";
  }
}

async function getAuthenticatedUserId(
  client: SupabaseClient,
): Promise<string | undefined> {
  const { data, error } = await client.auth.getClaims();
  const parsedUserId = userIdSchema.safeParse(data?.claims.sub);

  return error || !parsedUserId.success ? undefined : parsedUserId.data;
}

function parsePolicyId(policyId: string): string {
  const parsedPolicyId = policyIdSchema.safeParse(policyId);
  if (!parsedPolicyId.success) {
    throw new SavedPolicyError("정책 식별자가 올바르지 않습니다", "invalid_policy");
  }

  return parsedPolicyId.data;
}

export async function isPolicySaved(
  client: SupabaseClient,
  policyId: string,
): Promise<boolean> {
  const parsedPolicyId = parsePolicyId(policyId);
  const userId = await getAuthenticatedUserId(client);
  if (!userId) return false;

  const { data, error } = await client
    .from("saved_policies")
    .select("policy_id")
    .eq("user_id", userId)
    .eq("policy_id", parsedPolicyId)
    .maybeSingle();

  if (error) {
    throw new SavedPolicyError(
      `챙긴 정책을 확인하지 못했습니다: ${error.message}`,
      "database_error",
    );
  }

  return data !== null;
}

export async function savePolicy(
  client: SupabaseClient,
  policyId: string,
): Promise<void> {
  const parsedPolicyId = parsePolicyId(policyId);
  const userId = await getAuthenticatedUserId(client);
  if (!userId) {
    throw new SavedPolicyError("로그인이 필요합니다", "authentication_required");
  }

  const { data: policy, error: policyError } = await client
    .from("policies")
    .select("id")
    .eq("id", parsedPolicyId)
    .eq("lifecycle_status", "active")
    .maybeSingle();

  if (policyError) {
    throw new SavedPolicyError(
      `정책을 확인하지 못했습니다: ${policyError.message}`,
      "database_error",
    );
  }
  if (!policy) {
    throw new SavedPolicyError("챙길 수 없는 정책입니다", "invalid_policy");
  }

  const { error } = await client.from("saved_policies").upsert(
    {
      user_id: userId,
      policy_id: parsedPolicyId,
      status: "interested",
      priority: "normal",
    },
    { onConflict: "user_id,policy_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new SavedPolicyError(
      `정책을 챙기지 못했습니다: ${error.message}`,
      "database_error",
    );
  }
}

export async function removeSavedPolicy(
  client: SupabaseClient,
  policyId: string,
): Promise<void> {
  const parsedPolicyId = parsePolicyId(policyId);
  const userId = await getAuthenticatedUserId(client);
  if (!userId) {
    throw new SavedPolicyError("로그인이 필요합니다", "authentication_required");
  }

  const { error } = await client
    .from("saved_policies")
    .delete()
    .eq("user_id", userId)
    .eq("policy_id", parsedPolicyId);

  if (error) {
    throw new SavedPolicyError(
      `챙긴 정책을 삭제하지 못했습니다: ${error.message}`,
      "database_error",
    );
  }
}
