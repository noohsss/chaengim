import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizedPolicySchema, type NormalizedPolicy } from "./normalized-policy";
import { normalizedPolicyToRow, type PolicyRow } from "./policy-row";
import type { PolicyLifecycleStatus } from "./policy-lifecycle";

type PolicyLookupRow = { id: string; version_hash?: string };
type UpsertPolicyOptions = Readonly<{
  lifecycleStatus?: PolicyLifecycleStatus;
}>;

export class PolicyRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyRepositoryError";
  }
}

function sourcePath(source: NormalizedPolicy["sources"][number]): string {
  return `source_refs->${source}->>externalId`;
}

async function findExistingPolicy(
  client: SupabaseClient,
  policy: NormalizedPolicy,
): Promise<{ id: string; versionHash?: string } | null> {
  const existingPolicies = new Map<string, string | undefined>();

  for (const source of policy.sources) {
    const reference = policy.sourceRefs[source];
    if (!reference) {
      throw new PolicyRepositoryError(`정책 출처 식별자가 없습니다: ${source}`);
    }

    const { data, error } = await client
      .from("policies")
      .select("id,version_hash")
      .eq(sourcePath(source), reference.externalId)
      .maybeSingle<PolicyLookupRow>();

    if (error) {
      throw new PolicyRepositoryError(
        `정책 조회에 실패했습니다: ${error.message}`,
      );
    }
    if (data) existingPolicies.set(data.id, data.version_hash);
  }

  if (existingPolicies.size > 1) {
    throw new PolicyRepositoryError(
      "서로 다른 대표 정책에 연결된 출처를 자동 병합할 수 없습니다",
    );
  }

  const existing = [...existingPolicies.entries()][0];
  return existing ? { id: existing[0], versionHash: existing[1] } : null;
}

export async function upsertNormalizedPolicy(
  client: SupabaseClient,
  input: NormalizedPolicy,
  options: UpsertPolicyOptions = {},
): Promise<{ id: string; row: PolicyRow; wasChanged: boolean }> {
  const policy = normalizedPolicySchema.parse(input);
  const row = normalizedPolicyToRow(policy, options.lifecycleStatus);
  const existingPolicy = await findExistingPolicy(client, policy);

  if (existingPolicy) {
    const { data, error } = await client
      .from("policies")
      .update(row)
      .eq("id", existingPolicy.id)
      .select("id")
      .single<PolicyLookupRow>();

    if (error || !data) {
      throw new PolicyRepositoryError(
        `정책 갱신에 실패했습니다: ${error?.message ?? "응답이 없습니다"}`,
      );
    }

    return {
      id: data.id,
      row,
      wasChanged: existingPolicy.versionHash !== row.version_hash,
    };
  }

  const { data, error } = await client
    .from("policies")
    .insert(row)
    .select("id")
    .single<PolicyLookupRow>();

  if (error || !data) {
    throw new PolicyRepositoryError(
      `정책 생성에 실패했습니다: ${error?.message ?? "응답이 없습니다"}`,
    );
  }

  return { id: data.id, row, wasChanged: false };
}
