import { NextResponse, type NextRequest } from "next/server";

import {
  ACCOUNT_DELETION_COOKIE_NAME,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  createLoginPath,
  getSafeNextPathFromCookie,
} from "@/lib/auth/safe-next-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function createNoStoreRedirect(
  path: string,
  appUrl: string,
  clearAccountDeletionIntent = false,
): NextResponse {
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
  if (clearAccountDeletionIntent) {
    response.cookies.set({
      httpOnly: true,
      maxAge: 0,
      name: ACCOUNT_DELETION_COOKIE_NAME,
      path: AUTH_NEXT_COOKIE_PATH,
      sameSite: "lax",
      secure: new URL(appUrl).protocol === "https:",
      value: "",
    });
  }
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const appUrl = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPathFromCookie(
    request.cookies.get(AUTH_NEXT_COOKIE_NAME)?.value,
  );
  const hasAccountDeletionIntent = Boolean(
    request.cookies.get(ACCOUNT_DELETION_COOKIE_NAME)?.value,
  );

  if (!code) {
    return createNoStoreRedirect(
      createLoginPath(nextPath, "oauth_callback_failed"),
      appUrl,
      hasAccountDeletionIntent,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return createNoStoreRedirect(
      createLoginPath(nextPath, "oauth_callback_failed"),
      appUrl,
      hasAccountDeletionIntent,
    );
  }

  if (hasAccountDeletionIntent) {
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const authenticatedUserId = z.uuid().safeParse(claimsData?.claims.sub);
    const requestedUserId = z.uuid().safeParse(
      request.cookies.get(ACCOUNT_DELETION_COOKIE_NAME)?.value,
    );

    if (
      claimsError ||
      !authenticatedUserId.success ||
      !requestedUserId.success ||
      authenticatedUserId.data !== requestedUserId.data
    ) {
      await supabase.auth.signOut();
      return createNoStoreRedirect(
        createLoginPath("/", "account_delete_identity_mismatch"),
        appUrl,
        true,
      );
    }

    const { error: deleteError } = await createAdminClient().auth.admin.deleteUser(
      authenticatedUserId.data,
    );

    if (deleteError) {
      console.error("Account deletion failed", { name: deleteError.name });
      await supabase.auth.signOut();
      return createNoStoreRedirect(
        createLoginPath("/", "account_delete_failed"),
        appUrl,
        true,
      );
    }

    await supabase.auth.signOut();
    return createNoStoreRedirect("/?status=account_deleted", appUrl, true);
  }

  return createNoStoreRedirect(nextPath, appUrl);
}
