import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  createLoginPath,
  getSafeNextPathFromCookie,
} from "@/lib/auth/safe-next-path";
import { getPublicEnv } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

function createNoStoreRedirect(path: string, appUrl: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, appUrl));
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: AUTH_NEXT_COOKIE_NAME,
    path: AUTH_NEXT_COOKIE_PATH,
    sameSite: "lax",
    secure: new URL(appUrl).protocol === "https:",
    value: "",
  });
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const env = getPublicEnv();
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPathFromCookie(
    request.cookies.get(AUTH_NEXT_COOKIE_NAME)?.value,
  );

  if (!code) {
    return createNoStoreRedirect(
      createLoginPath(nextPath, "oauth_callback_failed"),
      env.NEXT_PUBLIC_APP_URL,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return createNoStoreRedirect(
      createLoginPath(nextPath, "oauth_callback_failed"),
      env.NEXT_PUBLIC_APP_URL,
    );
  }

  return createNoStoreRedirect(nextPath, env.NEXT_PUBLIC_APP_URL);
}
