"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createLoginPath, getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";
import {
  removeSavedPolicy,
  savePolicy,
  SavedPolicyError,
} from "@/server/saved-policies/policy-save";

const savePolicyInputSchema = z.object({
  intent: z.enum(["remove", "save"]),
  policyId: z.uuid(),
});

export async function updateSavedPolicy(formData: FormData): Promise<never> {
  const input = savePolicyInputSchema.safeParse({
    intent: formData.get("intent"),
    policyId: formData.get("policyId"),
  });

  if (!input.success) redirect("/?status=invalid");

  const policyPath = `/policies/${input.data.policyId}`;
  const client = await createClient();

  try {
    if (input.data.intent === "save") {
      await savePolicy(client, input.data.policyId);
    } else {
      await removeSavedPolicy(client, input.data.policyId);
    }
  } catch (error) {
    if (error instanceof SavedPolicyError) {
      if (error.code === "authentication_required") {
        redirect(createLoginPath(getSafeNextPath(policyPath)));
      }

      redirect(`${policyPath}?status=save_failed`);
    }

    console.error("Saved policy update failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    redirect(`${policyPath}?status=save_failed`);
  }

  revalidatePath(policyPath);
  redirect(`${policyPath}?status=${input.data.intent === "save" ? "saved" : "removed"}`);
}
