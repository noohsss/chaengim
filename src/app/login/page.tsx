import type { Metadata } from "next";
import type { ReactElement } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

import { signInWithGoogle } from "./actions";

export const metadata: Metadata = {
  title: "로그인 | 챙김",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  account_delete_identity_mismatch:
    "처음 로그인한 Google 계정으로 다시 인증해 주세요.",
  account_delete_failed:
    "회원 탈퇴를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.",
  login_required: "정책을 챙기려면 먼저 로그인해 주세요.",
  oauth_callback_failed:
    "로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.",
  oauth_start_failed: "Google 로그인을 시작하지 못했어요. 다시 시도해 주세요.",
};

const ACCOUNT_DELETION_MESSAGE =
  "회원 탈퇴를 계속하려면 같은 Google 계정으로 다시 인증해 주세요.";

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
  const isAccountDeletion = params.mode === "delete";

  return (
    <main className="ui-page flex items-center justify-center px-6 py-12">
      <section
        aria-labelledby="login-title"
        className="ui-card w-full max-w-md overflow-hidden p-0"
      >
        <div className="bg-[var(--brand-sky)] p-6 sm:p-8">
          <BrandLogo priority />
          <p className="ui-eyebrow mt-8">안전하게 이어가기</p>
        </div>
        <div className="p-6 sm:p-8">
          <h1
            className="text-2xl font-semibold leading-8 tracking-[-0.04em]"
            id="login-title"
          >
            필요한 혜택을 계속 챙겨 보세요
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Google 계정으로 간편하게 로그인할 수 있어요.
          </p>
        </div>

        <div className="p-6 sm:p-8">
        {errorMessage ? (
          <p
            className="ui-status-error mt-6 px-4 py-3 text-sm"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {isAccountDeletion ? (
          <p
            className="ui-status-error mt-6 px-4 py-3 text-sm"
            role="status"
          >
            {ACCOUNT_DELETION_MESSAGE}
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mt-8">
          <input name="next" type="hidden" value={nextPath} />
          <button
            className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-3 py-3 text-sm font-medium leading-5 text-[#1f1f1f] transition-colors hover:bg-[#f8fafd] active:bg-[#eef2f7]"
            type="submit"
          >
            <span
              aria-hidden="true"
              className="size-5 bg-[url('https://developers.google.com/static/identity/images/g-logo.png')] bg-contain bg-center bg-no-repeat"
            />
            Google 계정으로 로그인
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-4 text-muted-foreground">
          로그인하면 챙긴 정책과 진행 상태를 안전하게 저장할 수 있어요.
        </p>
        </div>
      </section>
    </main>
  );
}
