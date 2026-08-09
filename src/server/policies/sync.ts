import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  fetchGov24ServiceDetail,
  fetchGov24ServiceList,
  fetchYouthCenterPolicies,
} from "./public-api-client";
import {
  gov24ServiceDetailSchema,
  gov24ServiceListItemSchema,
  normalizeGov24Policy,
  normalizeYouthCenterPolicy,
  youthCenterPolicySchema,
} from "./adapters";
import { upsertNormalizedPolicy } from "./policy-repository";

const unknownArraySchema = z.array(z.unknown());
const recordSchema = z.record(z.string(), z.unknown());

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

function responseDetail(payload: Record<string, unknown>): unknown {
  const data = payload.data;
  const dataObject = recordSchema.safeParse(data);
  if (dataObject.success) return dataObject.data;
  const result = payload.result;
  const resultObject = recordSchema.safeParse(result);
  if (resultObject.success) return resultObject.data;
  return payload;
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

async function syncGov24(client: SupabaseClient): Promise<PolicySyncSourceResult> {
  try {
    const listPayload = await fetchGov24ServiceList({ page: 1, perPage: 100 });
    const listItems = responseRecords(listPayload);
    let upserted = 0;
    let failed = 0;

    for (const [index, item] of listItems.entries()) {
      const parsedItem = gov24ServiceListItemSchema.safeParse(item);
      if (!parsedItem.success) {
        logRejectedRecord("gov24", index, parsedItem.error);
        failed += 1;
        continue;
      }
      try {
        const detailPayload = await fetchGov24ServiceDetail(parsedItem.data.서비스ID);
        const detail = gov24ServiceDetailSchema.parse(responseDetail(detailPayload));
        const policy = normalizeGov24Policy({ detail, listItem: parsedItem.data });
        await upsertNormalizedPolicy(client, policy);
        upserted += 1;
      } catch (error) {
        logFailedItem("gov24", parsedItem.data.서비스ID, error);
        failed += 1;
      }
    }

    return { source: "gov24", fetched: listItems.length, upserted, failed };
  } catch (error) {
    return {
      source: "gov24",
      fetched: 0,
      upserted: 0,
      failed: 0,
      error: errorMessage(error),
    };
  }
}

async function syncYouthCenter(
  client: SupabaseClient,
): Promise<PolicySyncSourceResult> {
  try {
    const payload = await fetchYouthCenterPolicies({ pageIndex: 1, display: 100 });
    const records = responseRecords(payload);
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
        await upsertNormalizedPolicy(client, normalizeYouthCenterPolicy(parsed.data));
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
  const sources = await Promise.all([syncYouthCenter(client), syncGov24(client)]);
  return { startedAt, finishedAt: new Date().toISOString(), sources };
}
