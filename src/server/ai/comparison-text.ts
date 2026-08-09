import type { ComparisonResult } from "@/features/ai/comparison-schema";

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
  return {
    ...result,
    overview: replacePolicyIdsWithTitles(result.overview, policyTitles),
    comparisonRows: result.comparisonRows.map((row) => ({
      ...row,
      values: row.values.map((item) => ({
        ...item,
        value: replacePolicyIdsWithTitles(item.value, policyTitles),
      })),
      difference: replacePolicyIdsWithTitles(row.difference, policyTitles),
    })),
    priorityPolicy: {
      ...result.priorityPolicy,
      reason: replacePolicyIdsWithTitles(result.priorityPolicy.reason, policyTitles),
    },
    needsConfirmation: result.needsConfirmation.map((item) => ({
      ...item,
      reason: replacePolicyIdsWithTitles(item.reason, policyTitles),
    })),
    policyAssessments: result.policyAssessments.map((item) => ({
      ...item,
      strengths: item.strengths.map((text) => replacePolicyIdsWithTitles(text, policyTitles)),
      cautions: item.cautions.map((text) => replacePolicyIdsWithTitles(text, policyTitles)),
    })),
  };
}
