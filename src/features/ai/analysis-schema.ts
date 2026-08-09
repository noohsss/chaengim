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
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
