"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ComparisonError, runComparison } from "@/server/ai/comparison";
import { createClient } from "@/lib/supabase/server";

const policyIdsSchema = z.array(z.uuid()).min(2).max(3);

export async function requestComparison(formData: FormData): Promise<never> {
  const ids = policyIdsSchema.safeParse(formData.getAll("policyId"));
  if (!ids.success) redirect("/my/compare?status=invalid_selection");
  try {
    await runComparison(await createClient(), ids.data);
    redirect(`/my/compare?ids=${ids.data.join(",")}&status=completed`);
  } catch (error: unknown) {
    if (error instanceof ComparisonError) redirect(`/my/compare?ids=${ids.data.join(",")}&status=${error.code}`);
    throw error;
  }
}
