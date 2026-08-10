import type { AnalysisResult } from "@/features/ai/analysis-schema";
import { replacePolicyIdsWithTitles } from "./comparison-text";
import { replaceAiDisplayCodes } from "./display-text";

type PolicyTitles = Readonly<Record<string, string>>;

function normalizeText(value: string, policyTitles: PolicyTitles): string {
  return replaceAiDisplayCodes(replacePolicyIdsWithTitles(value, policyTitles));
}

export function normalizeAnalysisText(result: AnalysisResult, policyTitles: PolicyTitles): AnalysisResult {
  const normalize = (value: string) => normalizeText(value, policyTitles);
  return {
    ...result,
    overview: normalize(result.overview),
    priorityPolicy: result.priorityPolicy
      ? { ...result.priorityPolicy, reason: normalize(result.priorityPolicy.reason) }
      : null,
    urgentPolicies: result.urgentPolicies.map((item) => ({ ...item, reason: normalize(item.reason) })),
    needsConfirmation: result.needsConfirmation.map((item) => ({ ...item, reason: normalize(item.reason) })),
    nextSteps: result.nextSteps.map(normalize),
    fitChecks: result.fitChecks.map((item) => ({
      ...item,
      criterion: normalize(item.criterion),
      reason: normalize(item.reason),
    })),
    recommendedActions: result.recommendedActions.map((item) => ({
      ...item,
      action: normalize(item.action),
      reason: normalize(item.reason),
    })),
  };
}
