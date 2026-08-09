import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  getCurrentSeoulYear,
  profileSchema,
  REGION_OPTIONS,
} from "@/features/profile/profile-schema";
import { createClient } from "@/lib/supabase/server";

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

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, birth_year, region_code, employment_status, notification_email, notification_email_verified_at, email_opt_in, updated_at",
    )
    .eq("id", userId.data)
    .single();
  const profile = profileSchema.safeParse(data);

  if (error || !profile.success) {
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
    profile.data.notification_email &&
      profile.data.notification_email_verified_at,
  );

  return (
    <main className="min-h-screen px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Link aria-label="챙김 홈" href="/">
            <BrandLogo size="compact" />
          </Link>
        </header>

        <div className="mt-10">
          <h1 className="text-[1.375rem] font-medium leading-7 tracking-[-0.025em]">
            내 정보
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            입력한 정보는 정책을 살펴보고 챙길 때만 사용해요.
          </p>
        </div>

        {statusMessage ? (
          <p
            className={
              statusMessage.tone === "success"
                ? "mt-6 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground"
                : "mt-6 rounded-lg bg-[color-mix(in_srgb,var(--destructive)_8%,white)] px-4 py-3 text-sm text-destructive"
            }
            role={statusMessage.tone === "success" ? "status" : "alert"}
          >
            {statusMessage.message}
          </p>
        ) : null}

        <form action={updateProfile} className="mt-6 space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-[0_12px_36px_rgba(37,42,51,0.06)]">
            <h2 className="font-medium">기본 프로필</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                출생연도
                <select
                  className="min-h-11 rounded-[var(--radius-control)] border bg-white px-3 text-base font-normal sm:text-sm"
                  defaultValue={profile.data.birth_year ?? ""}
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
                  className="min-h-11 rounded-[var(--radius-control)] border bg-white px-3 text-base font-normal sm:text-sm"
                  defaultValue={profile.data.region_code ?? ""}
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
                  className="min-h-11 rounded-[var(--radius-control)] border bg-white px-3 text-base font-normal sm:text-sm"
                  defaultValue={profile.data.employment_status ?? ""}
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

          <section className="rounded-xl border bg-card p-6 shadow-[0_12px_36px_rgba(37,42,51,0.06)]">
            <h2 className="font-medium">이메일 알림</h2>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {profile.data.notification_email ?? "연결된 이메일이 없어요."}
            </p>
            <label className="mt-5 flex min-h-11 items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <input
                className="mt-0.5 size-5 accent-[var(--primary)]"
                defaultChecked={profile.data.email_opt_in}
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
            <button
              className="min-h-11 rounded-[var(--radius-control)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
              type="submit"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
