"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createProfileUpdateSchema,
  getCurrentSeoulYear,
} from "@/features/profile/profile-schema";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();

async function getAuthenticatedUserId(): Promise<string | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = userIdSchema.safeParse(data?.claims.sub);

  if (error || !userId.success) {
    return undefined;
  }

  return userId.data;
}

export async function updateProfile(formData: FormData): Promise<never> {
  const profileInput = createProfileUpdateSchema(
    getCurrentSeoulYear(),
  ).safeParse({
    birthYear: formData.get("birthYear"),
    emailOptIn: formData.get("emailOptIn") === "on",
    employmentStatus: formData.get("employmentStatus"),
    regionCode: formData.get("regionCode"),
  });

  if (!profileInput.success) {
    redirect("/settings?status=invalid");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login?next=%2Fsettings");
  }

  const supabase = await createClient();

  if (profileInput.data.emailOptIn) {
    const { data: emailProfile, error: emailProfileError } = await supabase
      .from("profiles")
      .select("notification_email, notification_email_verified_at")
      .eq("id", userId)
      .single();

    if (
      emailProfileError ||
      !emailProfile?.notification_email ||
      !emailProfile.notification_email_verified_at
    ) {
      redirect("/settings?status=email_unverified");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      birth_year: profileInput.data.birthYear,
      email_opt_in: profileInput.data.emailOptIn,
      employment_status: profileInput.data.employmentStatus,
      region_code: profileInput.data.regionCode,
    })
    .eq("id", userId)
    .select("id")
    .single();

  if (error) {
    console.error("Profile update failed", { code: error.code });
    redirect("/settings?status=save_failed");
  }

  revalidatePath("/settings");
  redirect("/settings?status=saved");
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out failed", { name: error.name });
    redirect("/settings?status=sign_out_failed");
  }

  redirect("/");
}
