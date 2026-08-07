const DEFAULT_NEXT_PATH = "/";
const MAX_NEXT_PATH_LENGTH = 2_048;
const MAX_AUTH_NEXT_COOKIE_LENGTH = 3_000;
const INTERNAL_URL_BASE = "https://internal.chaengim.invalid";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ENCODED_PATH_SEPARATOR_PATTERN = /%(?:2f|5c)/i;

export const AUTH_NEXT_COOKIE_NAME = "chaengim_auth_next";
export const AUTH_NEXT_COOKIE_PATH = "/auth/callback";
export const AUTH_NEXT_COOKIE_MAX_AGE_SECONDS = 10 * 60;

const ALLOWED_PATH_PREFIXES = [
  "/policies",
  "/my",
  "/notifications",
  "/settings",
] as const;

function isAllowedPathname(pathname: string): boolean {
  if (pathname === DEFAULT_NEXT_PATH) {
    return true;
  }

  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_NEXT_PATH_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    ENCODED_PATH_SEPARATOR_PATTERN.test(value)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const url = new URL(value, INTERNAL_URL_BASE);

    if (url.origin !== INTERNAL_URL_BASE || !isAllowedPathname(url.pathname)) {
      return DEFAULT_NEXT_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}

export function createLoginPath(nextPath: unknown, error?: string): string {
  const searchParams = new URLSearchParams({
    next: getSafeNextPath(nextPath),
  });

  if (error) {
    searchParams.set("error", error);
  }

  return `/login?${searchParams.toString()}`;
}

export function encodeAuthNextPathCookie(nextPath: unknown): string {
  const encodedPath = encodeURIComponent(getSafeNextPath(nextPath));

  return encodedPath.length <= MAX_AUTH_NEXT_COOKIE_LENGTH
    ? encodedPath
    : encodeURIComponent(DEFAULT_NEXT_PATH);
}

export function getSafeNextPathFromCookie(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_NEXT_PATH;
  }

  try {
    return getSafeNextPath(decodeURIComponent(value));
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}
