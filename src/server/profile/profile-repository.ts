import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { profileSchema, type Profile } from "@/features/profile/profile-schema";
import { createAdminClient } from "@/lib/supabase/admin";

const PROFILE_COLUMNS =
  "id, birth_year, region_code, employment_status, notification_email, notification_email_verified_at, email_opt_in, updated_at";

export async function getProfileForUser(
  client: SupabaseClient,
  userId: string,
): Promise<Profile | undefined> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile query failed", {
      code: error.code,
    });
    return undefined;
  }

  const profile = profileSchema.safeParse(data);

  if (profile.success) {
    return profile.data;
  }

  if (data !== null) {
    console.error("Profile response validation failed", {
      issueCount: profile.error.issues.length,
    });
    return undefined;
  }

  return createMissingProfile(client, userId);
}

async function createMissingProfile(
  client: SupabaseClient,
  userId: string,
): Promise<Profile | undefined> {
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user || userData.user.id !== userId) {
    console.error("Profile recovery user lookup failed", {
      name: userError?.name,
    });
    return undefined;
  }

  const email = userData.user.email?.trim().toLowerCase() || null;
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        notification_email: email,
        notification_email_verified_at: email
          ? userData.user.email_confirmed_at
          : null,
      },
      { onConflict: "id" },
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    console.error("Profile recovery failed", {
      code: error.code,
    });
    return undefined;
  }

  const profile = profileSchema.safeParse(data);

  if (!profile.success) {
    console.error("Recovered profile validation failed", {
      issueCount: profile.error.issues.length,
    });
    return undefined;
  }

  return profile.data;
}
