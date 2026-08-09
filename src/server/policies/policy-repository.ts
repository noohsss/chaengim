import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizedPolicySchema, type NormalizedPolicy } from "./normalized-policy";
import { normalizedPolicyToRow, type PolicyRow } from "./policy-row";

type PolicyLookupRow = { id: string };

export class PolicyRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyRepositoryError";
  }
}

function sourcePath(source: NormalizedPolicy["sources"][number]): string {
  return `source_refs->${source}->>externalId`;
}

async function findExistingPolicyId(
  client: SupabaseClient,
  policy: NormalizedPolicy,
): Promise<string | null> {
  const existingIds = new Set<string>();

  for (const source of policy.sources) {
    const reference = policy.sourceRefs[source];
    if (!reference) {
      throw new PolicyRepositoryError(`정책 출처 식별자가 없습니다: ${source}`);
    }

    const { data, error } = await client
      .from("policies")
      .select("id")
      .eq(sourcePath(source), reference.externalId)
      .maybeSingle<PolicyLookupRow>();

    if (error) {
      throw new PolicyRepositoryError(
        `정책 조회에 실패했습니다: ${error.message}`,
      );
    }
    if (data) existingIds.add(data.id);
  }

  if (existingIds.size > 1) {
    throw new PolicyRepositoryError(
      "서로 다른 대표 정책에 연결된 출처를 자동 병합할 수 없습니다",
    );
  }

  return [...existingIds][0] ?? null;
}

export async function upsertNormalizedPolicy(
  client: SupabaseClient,
  input: NormalizedPolicy,
): Promise<{ id: string; row: PolicyRow }> {
  const policy = normalizedPolicySchema.parse(input);
  const row = normalizedPolicyToRow(policy);
  const existingId = await findExistingPolicyId(client, policy);

  if (existingId) {
    const { data, error } = await client
      .from("policies")
      .update(row)
      .eq("id", existingId)
      .select("id")
      .single<PolicyLookupRow>();

    if (error || !data) {
      throw new PolicyRepositoryError(
        `정책 갱신에 실패했습니다: ${error?.message ?? "응답이 없습니다"}`,
      );
    }

    return { id: data.id, row };
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

  return { id: data.id, row };
}
