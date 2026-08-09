import { createHash } from "node:crypto";

import { z } from "zod";

export const policySourceSchema = z.literal("youth_center");
export const policyCategorySchema = z.enum([
  "jobs_startup",
  "housing",
  "education",
  "finance",
  "welfare_culture",
  "participation_rights",
  "other",
]);

export const sourceRefSchema = z.object({
  externalId: z.string().trim().min(1),
  url: z.url().optional(),
});

export const normalizedPolicySchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    summary: z.string().trim().min(1).optional(),
    supportContent: z.string().trim().min(1).optional(),
    eligibility: z.string().trim().min(1).optional(),
    applicationStartDate: z.iso.date().optional(),
    applicationEndDate: z.iso.date().optional(),
    applicationPeriodText: z.string().trim().min(1).optional(),
    isRolling: z.boolean(),
    applicationMethod: z.string().trim().min(1).optional(),
    applicationUrl: z.url().optional(),
    organizationName: z.string().trim().min(1).optional(),
    contact: z.string().trim().min(1).optional(),
    category: policyCategorySchema,
    regionCodes: z.array(z.string().trim().min(1)).min(1),
    sources: z.array(policySourceSchema).min(1),
    sourceRefs: z.object({
      youth_center: sourceRefSchema.optional(),
    }),
    versionHash: z.string().trim().min(1),
  })
  .superRefine((policy, ctx) => {
    const hasYouthCenter = policy.sources.includes("youth_center");

    if (hasYouthCenter !== Boolean(policy.sourceRefs.youth_center)) {
      ctx.addIssue({
        code: "custom",
        message: "sources and sourceRefs.youth_center must match",
        path: ["sourceRefs", "youth_center"],
      });
    }

    if (
      policy.applicationStartDate &&
      policy.applicationEndDate &&
      policy.applicationEndDate < policy.applicationStartDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "applicationEndDate must be after applicationStartDate",
        path: ["applicationEndDate"],
      });
    }
  });

export type PolicySource = z.infer<typeof policySourceSchema>;
export type PolicyCategory = z.infer<typeof policyCategorySchema>;
export type NormalizedPolicy = z.infer<typeof normalizedPolicySchema>;

const VERSION_HASH_FIELDS = [
  "title",
  "summary",
  "supportContent",
  "eligibility",
  "applicationStartDate",
  "applicationEndDate",
  "applicationPeriodText",
  "isRolling",
  "applicationMethod",
  "applicationUrl",
  "organizationName",
  "contact",
  "category",
  "regionCodes",
] as const satisfies readonly (keyof NormalizedPolicy)[];

export function createPolicyVersionHash(
  policy: Omit<NormalizedPolicy, "versionHash">,
): string {
  const versionInput = VERSION_HASH_FIELDS.reduce<
    Partial<Pick<NormalizedPolicy, (typeof VERSION_HASH_FIELDS)[number]>>
  >((fields, key) => {
    return { ...fields, [key]: policy[key] };
  }, {});

  return createHash("sha256")
    .update(JSON.stringify(versionInput))
    .digest("hex");
}

export function finalizeNormalizedPolicy(
  policy: Omit<NormalizedPolicy, "versionHash">,
): NormalizedPolicy {
  return normalizedPolicySchema.parse({
    ...policy,
    versionHash: createPolicyVersionHash(policy),
  });
}
