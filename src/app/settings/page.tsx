import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { PageBackButton } from "@/components/navigation/page-back-button";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  getCurrentSeoulYear,
  REGION_OPTIONS,
} from "@/features/profile/profile-schema";
import { createClient } from "@/lib/supabase/server";
import { getProfileForUser } from "@/server/profile/profile-repository";

import { updateProfile } from "./actions";

export const metadata: Metadata = {
  title: "설정 | 챙김",
};

type SettingsPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

const STATUS_MESSAGES = {
  email_unverified: {
    message: "인증된 이메일이 있어야 마감 알림을 받을 수 있어요.",
    tone: "error",
  },
  invalid: {
    message: "입력한 프로필 정보를 다시 확인해 주세요.",
    tone: "error",
  },
  save_failed: {
    message: "프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    tone: "error",
  },
  sign_out_failed: {
    message: "로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.",
    tone: "error",
  },
  saved: {
    message: "프로필을 저장했어요.",
    tone: "success",
  },
} as const;

const statusSchema = z.enum([
  "email_unverified",
  "invalid",
  "save_failed",
  "sign_out_failed",
  "saved",
]);

function getStatusMessage(status: string | string[] | undefined) {
  const validatedStatus = statusSchema.safeParse(status);

  if (!validatedStatus.success) {
    return undefined;
  }

  return STATUS_MESSAGES[validatedStatus.data];
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps): Promise<ReactElement> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = z.uuid().safeParse(claimsData?.claims.sub);

  if (claimsError || !userId.success) {
    redirect("/login?next=%2Fsettings");
  }

  const profile = await getProfileForUser(supabase, userId.data);

  if (!profile) {
    throw new Error("프로필을 불러오지 못했습니다.");
  }

  const params = await searchParams;
  const statusMessage = getStatusMessage(params.status);
  const currentYear = getCurrentSeoulYear();
  const birthYears = Array.from(
    { length: currentYear - 1899 },
    (_, index) => currentYear - index,
  );
  const isEmailVerified = Boolean(
    profile.notification_email && profile.notification_email_verified_at,
  );

  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-2xl">
        <header className="rounded-[var(--radius)] bg-[var(--brand-sky)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link aria-label="챙김 홈" href="/">
              <BrandLogo size="compact" />
            </Link>
            <PageBackButton fallbackHref="/" />
          </div>
          <div className="mt-10">
            <p className="ui-eyebrow">내 정보</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              내 정보
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              입력한 정보는 정책을 살펴보고 챙길 때만 사용해요.
            </p>
          </div>
        </header>

        {statusMessage ? (
          <p
            className={
              statusMessage.tone === "success"
                ? "ui-status-success mt-6 px-4 py-3 text-sm"
                : "ui-status-error mt-6 px-4 py-3 text-sm"
            }
            role={statusMessage.tone === "success" ? "status" : "alert"}
          >
            {statusMessage.message}
          </p>
        ) : null}

        <form action={updateProfile} className="mt-6 space-y-6">
          <section className="ui-card border-t-4 border-t-[var(--brand-cornflower)] p-6">
            <h2 className="text-lg font-medium">기본 프로필</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                출생연도
                <select
                  className="ui-control text-base font-normal sm:text-sm"
                  defaultValue={profile.birth_year ?? ""}
                  name="birthYear"
                >
                  <option value="">선택하지 않음</option>
                  {birthYears.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                거주 시도
                <select
                  className="ui-control text-base font-normal sm:text-sm"
                  defaultValue={profile.region_code ?? ""}
                  name="regionCode"
                >
                  <option value="">선택하지 않음</option>
                  {REGION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                현재 상태
                <select
                  className="ui-control text-base font-normal sm:text-sm"
                  defaultValue={profile.employment_status ?? ""}
                  name="employmentStatus"
                >
                  <option value="">선택하지 않음</option>
                  {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="ui-card border-t-4 border-t-[var(--brand-mint)] p-6">
            <h2 className="text-lg font-medium">이메일 알림</h2>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {profile.notification_email ?? "연결된 이메일이 없어요."}
            </p>
            <label className="mt-5 flex min-h-11 items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <input
                className="mt-0.5 size-5 accent-[var(--primary)]"
                defaultChecked={profile.email_opt_in}
                disabled={!isEmailVerified}
                name="emailOptIn"
                type="checkbox"
              />
              <span>
                마감 알림 이메일 받기
                <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                  {isEmailVerified
                    ? "챙긴 정책의 마감 7일 전과 1일 전에 알려드려요."
                    : "Google에서 인증된 이메일이 확인되지 않았어요."}
                </span>
              </span>
            </label>
          </section>

          <div className="flex justify-end">
            <button className="ui-primary-action" type="submit">
              저장하기
            </button>
          </div>
        </form>

        <section className="mt-10 rounded-[var(--radius)] border border-destructive/30 bg-[color-mix(in_srgb,var(--destructive)_3%,white)] p-6">
          <h2 className="font-medium text-destructive">계정 삭제</h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            회원 탈퇴 시 챙긴 정책, 메모, 신청 결과와 모든 알림 기록이 영구적으로
            삭제돼요.
          </p>
          <div className="mt-5 flex justify-end">
            <DeleteAccountForm />
          </div>
        </section>
      </div>
    </main>
  );
}
