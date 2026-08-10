import type { ComparisonResult } from "@/features/ai/comparison-schema";
import { replaceAiDisplayCodes } from "./display-text";

type PolicyTitles = Readonly<Record<string, string>>;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePolicyId(value: string, policyId: string, title: string): string {
  const fullIdPattern = new RegExp(escapeRegExp(policyId), "g");
  const shortId = policyId.slice(0, 8);
  const shortIdPattern = new RegExp(`\\b${escapeRegExp(shortId)}\\b`, "gi");
  return value.replace(fullIdPattern, title).replace(shortIdPattern, title);
}

export function replacePolicyIdsWithTitles(value: string, policyTitles: PolicyTitles): string {
  return Object.entries(policyTitles)
    .sort(([firstId], [secondId]) => secondId.length - firstId.length)
    .reduce((text, [policyId, title]) => replacePolicyId(text, policyId, title), value);
}

export function normalizeComparisonText(result: ComparisonResult, policyTitles: PolicyTitles): ComparisonResult {
  const normalize = (value: string) => replaceAiDisplayCodes(replacePolicyIdsWithTitles(value, policyTitles));
  return {
    ...result,
    overview: normalize(result.overview),
    comparisonRows: result.comparisonRows.map((row) => ({
      ...row,
      label: normalize(row.label),
      values: row.values.map((item) => ({
        ...item,
        value: normalize(item.value),
      })),
      difference: normalize(row.difference),
    })),
    priorityPolicy: {
      ...result.priorityPolicy,
      reason: normalize(result.priorityPolicy.reason),
    },
    needsConfirmation: result.needsConfirmation.map((item) => ({
      ...item,
      reason: normalize(item.reason),
    })),
    policyAssessments: result.policyAssessments.map((item) => ({
      ...item,
      strengths: item.strengths.map(normalize),
      cautions: item.cautions.map(normalize),
    })),
  };
}
