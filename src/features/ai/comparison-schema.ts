import { z } from "zod";

const comparisonValueSchema = z.object({
  policyId: z.uuid(),
  value: z.string().trim().min(1).max(1200),
});

const citedPolicySchema = z.object({
  policyId: z.uuid(),
  reason: z.string().trim().min(1).max(1000),
});

export const comparisonResultSchema = z.object({
  overview: z.string().trim().min(1).max(2000),
  comparisonRows: z.array(z.object({
    label: z.string().trim().min(1).max(100),
    values: z.array(comparisonValueSchema).min(2).max(3),
    difference: z.string().trim().min(1).max(1200),
  })).min(3).max(8),
  priorityPolicy: citedPolicySchema,
  needsConfirmation: z.array(citedPolicySchema).max(10),
  policyAssessments: z.array(z.object({
    policyId: z.uuid(),
    strengths: z.array(z.string().trim().min(1).max(500)).min(1).max(3),
    cautions: z.array(z.string().trim().min(1).max(500)).min(1).max(3),
  })).max(3).default([]),
});

export type ComparisonResult = z.infer<typeof comparisonResultSchema>;
