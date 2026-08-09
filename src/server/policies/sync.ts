import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  fetchYouthCenterPolicies,
} from "./public-api-client";
import {
  normalizeYouthCenterPolicy,
  youthCenterPolicySchema,
} from "./adapters";
import { upsertNormalizedPolicy } from "./policy-repository";
import { getPolicyLifecycleStatus } from "./policy-lifecycle";

const unknownArraySchema = z.array(z.unknown());
const recordSchema = z.record(z.string(), z.unknown());
const YOUTH_CENTER_PAGE_SIZE = 100;
const MAX_YOUTH_CENTER_PAGES = 1_000;

export type PolicySyncSourceResult = Readonly<{
  source: "youth_center" | "gov24";
  fetched: number;
  upserted: number;
  failed: number;
  error?: string;
}>;

export type PolicySyncResult = Readonly<{
  startedAt: string;
  finishedAt: string;
  sources: readonly PolicySyncSourceResult[];
}>;

function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    const parsed = unknownArraySchema.safeParse(value);
    if (parsed.success) return parsed.data;
  }
  return [];
}

function responseRecords(payload: Record<string, unknown>): unknown[] {
  const result = payload.result;
  const resultObject = recordSchema.safeParse(result);
  if (resultObject.success) {
    return firstArray(
      payload.data,
      resultObject.data.data,
      resultObject.data.youthPolicyList,
      resultObject.data.policyList,
      resultObject.data.list,
    );
  }
  return firstArray(payload.data, payload.result, payload.youthPolicyList);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "알 수 없는 동기화 오류";
}

function validationIssues(error: z.ZodError): readonly Readonly<{
  code: string;
  message: string;
  path: string;
}>[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.map(String).join("."),
  }));
}

function logRejectedRecord(
  source: PolicySyncSourceResult["source"],
  index: number,
  error: z.ZodError,
): void {
  console.warn("Policy sync record rejected", {
    index,
    issues: validationIssues(error),
    source,
  });
}

function logFailedItem(
  source: PolicySyncSourceResult["source"],
  externalId: string,
  error: unknown,
): void {
  console.warn("Policy sync item failed", {
    error: errorMessage(error),
    externalId,
    source,
  });
}

async function fetchAllYouthCenterPolicies(): Promise<unknown[]> {
  const records: unknown[] = [];

  for (let pageNum = 1; pageNum <= MAX_YOUTH_CENTER_PAGES; pageNum += 1) {
    const payload = await fetchYouthCenterPolicies({
      pageNum,
      pageSize: YOUTH_CENTER_PAGE_SIZE,
    });
    const pageRecords = responseRecords(payload);
    records.push(...pageRecords);

    if (pageRecords.length < YOUTH_CENTER_PAGE_SIZE) {
      return records;
    }
  }

  throw new Error("온통청년 정책 페이지 수가 허용된 최대치를 초과했습니다");
}

async function syncYouthCenter(
  client: SupabaseClient,
): Promise<PolicySyncSourceResult> {
  try {
    const records = await fetchAllYouthCenterPolicies();
    let upserted = 0;
    let failed = 0;

    for (const [index, record] of records.entries()) {
      const parsed = youthCenterPolicySchema.safeParse(record);
      if (!parsed.success) {
        logRejectedRecord("youth_center", index, parsed.error);
        failed += 1;
        continue;
      }
      try {
        const policy = normalizeYouthCenterPolicy(parsed.data);
        await upsertNormalizedPolicy(client, policy, {
          lifecycleStatus: getPolicyLifecycleStatus(policy),
        });
        upserted += 1;
      } catch (error) {
        logFailedItem("youth_center", parsed.data.plcyNo, error);
        failed += 1;
      }
    }

    return { source: "youth_center", fetched: records.length, upserted, failed };
  } catch (error) {
    return {
      source: "youth_center",
      fetched: 0,
      upserted: 0,
      failed: 0,
      error: errorMessage(error),
    };
  }
}

export async function syncPolicies(client: SupabaseClient): Promise<PolicySyncResult> {
  const startedAt = new Date().toISOString();
  const sources = [await syncYouthCenter(client)];
  return { startedAt, finishedAt: new Date().toISOString(), sources };
}
