import { z } from "zod";

const citedPolicySchema = z.object({
  policyId: z.uuid(),
  reason: z.string().trim().min(1).max(1000),
});

export const analysisResultSchema = z.object({
  overview: z.string().trim().min(1).max(2000),
  priorityPolicy: citedPolicySchema.nullable(),
  urgentPolicies: z.array(citedPolicySchema).max(10),
  needsConfirmation: z.array(citedPolicySchema).max(20),
  nextSteps: z.array(z.string().trim().min(1).max(500)).max(10),
  fitChecks: z.array(z.object({
    policyId: z.uuid(),
    status: z.enum(["matches", "needs_confirmation", "potential_mismatch"]),
    criterion: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(1).max(1000),
  })).max(20).default([]),
  recommendedActions: z.array(z.object({
    policyId: z.uuid(),
    action: z.string().trim().min(1).max(300),
    reason: z.string().trim().min(1).max(800),
  })).max(10).default([]),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
