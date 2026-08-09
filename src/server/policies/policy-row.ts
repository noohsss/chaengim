import {
  normalizedPolicySchema,
  type NormalizedPolicy,
} from "./normalized-policy";
import {
  policyLifecycleStatusSchema,
  type PolicyLifecycleStatus,
} from "./policy-lifecycle";
import { z } from "zod";

export const policyRowSchema = normalizedPolicySchema.transform((policy) => ({
  title: policy.title,
  summary: policy.summary ?? null,
  support_content: policy.supportContent ?? null,
  eligibility: policy.eligibility ?? null,
  application_start_date: policy.applicationStartDate ?? null,
  application_end_date: policy.applicationEndDate ?? null,
  application_period_text: policy.applicationPeriodText ?? null,
  is_rolling: policy.isRolling,
  application_method: policy.applicationMethod ?? null,
  application_url: policy.applicationUrl ?? null,
  organization_name: policy.organizationName ?? null,
  contact: policy.contact ?? null,
  category: policy.category,
  region_codes: policy.regionCodes,
  sources: policy.sources,
  source_refs: policy.sourceRefs,
  lifecycle_status: policyLifecycleStatusSchema.parse("active"),
  version_hash: policy.versionHash,
}));

export type PolicyRow = z.infer<typeof policyRowSchema>;

export function normalizedPolicyToRow(
  policy: NormalizedPolicy,
  lifecycleStatus: PolicyLifecycleStatus = "active",
): PolicyRow {
  const row = policyRowSchema.parse(policy);
  return { ...row, lifecycle_status: lifecycleStatus };
}
