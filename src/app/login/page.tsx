import type { Metadata } from "next";
import type { ReactElement } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

import { signInWithKakao } from "./actions";

export const metadata: Metadata = {
  title: "로그인 | 챙김",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  oauth_callback_failed:
    "로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.",
  oauth_start_failed: "카카오 로그인을 시작하지 못했어요. 다시 시도해 주세요.",
};

function getErrorMessage(
  error: string | string[] | undefined,
): string | undefined {
  if (typeof error !== "string") {
    return undefined;
  }

  return ERROR_MESSAGES[error];
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const nextPath = getSafeNextPath(params.next);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-[0_16px_48px_rgba(37,42,51,0.08)] sm:p-8"
      >
        <BrandLogo priority />
        <div className="mt-8">
          <h1
            className="text-[1.375rem] font-medium leading-7 tracking-[-0.025em]"
            id="login-title"
          >
            필요한 혜택을 계속 챙겨 보세요
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            카카오 계정으로 간편하게 로그인할 수 있어요.
          </p>
        </div>

        {errorMessage ? (
          <p
            className="mt-6 rounded-lg bg-[color-mix(in_srgb,var(--destructive)_8%,white)] px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <form action={signInWithKakao} className="mt-8">
          <input name="next" type="hidden" value={nextPath} />
          <button
            className="flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
            type="submit"
          >
            카카오로 시작하기
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-4 text-muted-foreground">
          로그인하면 챙긴 정책과 진행 상태를 안전하게 저장할 수 있어요.
        </p>
      </section>
    </main>
  );
}
