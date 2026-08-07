import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { createLoginPath } from "@/lib/auth/safe-next-path";
import { getPublicEnv } from "@/lib/env/public";

const PROTECTED_PATH_PREFIXES = ["/my", "/notifications", "/settings"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyResponseCookies(
  source: NextResponse,
  target: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((headerName) => {
    const headerValue = source.headers.get(headerName);

    if (headerValue) {
      target.headers.set(headerName, headerValue);
    }
  });
  return target;
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  if (isProtectedPath(request.nextUrl.pathname) && !data?.claims) {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    return copyResponseCookies(
      response,
      NextResponse.redirect(new URL(createLoginPath(nextPath), request.url)),
    );
  }

  return response;
}
