"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ACCOUNT_DELETION_COOKIE_NAME,
  AUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  createLoginPath,
  encodeAuthNextPathCookie,
  getSafeNextPath,
} from "@/lib/auth/safe-next-path";
import { getPublicEnv } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData): Promise<never> {
  const env = getPublicEnv();
  const nextPath = getSafeNextPath(formData.get("next"));
  const requestHeaders = await headers();
  const requestOrigin = z.url().safeParse(requestHeaders.get("origin"));
  const appUrl = requestOrigin.success ? requestOrigin.data : env.NEXT_PUBLIC_APP_URL;
  const callbackUrl = new URL("/auth/callback", appUrl);
  const cookieStore = await cookies();
  cookieStore.set({
    httpOnly: true,
    maxAge: AUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
    name: AUTH_NEXT_COOKIE_NAME,
    path: AUTH_NEXT_COOKIE_PATH,
    sameSite: "lax",
    secure: callbackUrl.protocol === "https:",
    value: encodeAuthNextPathCookie(nextPath),
  });
  const supabase = await createClient();
  const isAccountDeletionReauthentication = Boolean(
    cookieStore.get(ACCOUNT_DELETION_COOKIE_NAME)?.value,
  );
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      ...(isAccountDeletionReauthentication
        ? { queryParams: { prompt: "login" } }
        : {}),
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect(createLoginPath(nextPath, "oauth_start_failed"));
  }

  redirect(data.url);
}
