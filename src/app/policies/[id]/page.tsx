import {
  CalendarDays,
  ExternalLink,
  MapPin,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { SavePolicyButton } from "@/components/policies/save-policy-button";
import { createLoginPath } from "@/lib/auth/safe-next-path";
import { REGION_OPTIONS } from "@/features/profile/profile-schema";
import { createClient } from "@/lib/supabase/server";
import { formatYouthCenterEligibility } from "@/server/policies/adapters/normalize-utils";
import { isPolicySaved } from "@/server/saved-policies/policy-save";
import {
  getPublicPolicy,
  type PublicPolicyDetail,
} from "@/server/policies/policy-query";

import { updateSavedPolicy } from "./actions";

const categoryLabels: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

type PolicyPageProps = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function formatPeriod(policy: PublicPolicyDetail): string {
  if (policy.is_rolling) return "상시 모집";
  if (policy.application_start_date && policy.application_end_date) {
    return `${policy.application_start_date} ~ ${policy.application_end_date}`;
  }
  if (policy.application_end_date) return `${policy.application_end_date} 마감`;
  return policy.application_period_text ?? "신청 기간 확인 필요";
}

function formatRegions(regionCodes: readonly string[]): string {
  return regionCodes
    .map(
      (code) =>
        REGION_OPTIONS.find((option) => option.value === code)?.label ??
        (code === "00" ? "전국" : code),
    )
    .join(", ");
}

function formatSyncedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages: Readonly<Record<string, string>> = {
  removed: "챙긴 정책에서 삭제했어요.",
  save_failed: "정책을 챙기지 못했어요. 잠시 후 다시 시도해 주세요.",
  saved: "정책을 챙겼어요. 내 챙김에서 이어서 관리할 수 있어요.",
};

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { id } = await params;
  const policy = await getPublicPolicy(await createClient(), id);

  return {
    title: policy ? `${policy.title} | 챙김` : "정책을 찾을 수 없어요 | 챙김",
    description: policy?.summary ?? "청년 정책의 지원 내용과 신청 조건을 확인하세요.",
  };
}

export default async function PolicyDetailPage({
  params,
  searchParams,
}: PolicyPageProps) {
  const { id } = await params;
  const client = await createClient();
  const policy = await getPublicPolicy(client, id);
  if (!policy) notFound();

  const isSaved = await isPolicySaved(client, id);
  const { data: claimsData } = await client.auth.getClaims();
  const isAuthenticated = z.uuid().safeParse(claimsData?.claims.sub).success;
  const status = firstParam((await searchParams).status);
  const sourceUrl = policy.source_refs.youth_center?.url;

  return (
    <main className="ui-page">
      <div className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
        <article className="ui-card overflow-hidden border-t-4 border-t-[var(--brand-cornflower)]">
          <header className="border-b border-border px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                  {categoryLabels[policy.category]}
                </span>
                <span className="text-muted-foreground">온통청년</span>
              </div>
              <SavePolicyButton
                isAuthenticated={isAuthenticated}
                isSaved={isSaved}
                loginPath={createLoginPath(`/policies/${policy.id}`)}
                onSave={updateSavedPolicy}
                policyId={policy.id}
              />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {policy.title}
            </h1>
            {policy.summary ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                {policy.summary}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" size={16} />
                {formatPeriod(policy)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={16} />
                {formatRegions(policy.region_codes)}
              </span>
            </div>
            {status && statusMessages[status] ? (
              <p className="mt-3 text-sm text-accent-foreground" role="status">
                {statusMessages[status]}
              </p>
            ) : null}
          </header>

          <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_260px]">
            <div className="space-y-9">
              <DetailSection title="지원 내용" value={policy.support_content} />
              <DetailSection
                title="신청 조건"
                value={formatYouthCenterEligibility(policy.eligibility) ?? null}
              />
              <DetailSection title="신청 방법" value={policy.application_method} />
            </div>

            <aside className="h-fit rounded-2xl bg-secondary/60 p-5">
              <dl className="space-y-5 text-sm">
                <DetailItem label="신청 기간" value={formatPeriod(policy)} />
                <DetailItem label="담당 기관" value={policy.organization_name} />
                <DetailItem label="문의처" value={policy.contact} />
              </dl>
              {policy.application_url ? (
                <a
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
                  href={policy.application_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  공식 신청 페이지
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              ) : null}
            </aside>
          </div>

          <footer className="flex flex-col gap-2 border-t border-border px-6 py-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <span>
              출처: {sourceUrl ? <a className="underline underline-offset-2" href={sourceUrl} rel="noreferrer" target="_blank">온통청년 원문</a> : "온통청년"}
            </span>
            <span>최근 갱신 {formatSyncedAt(policy.last_synced_at)}</span>
          </footer>
        </article>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          정책 정보는 참고용이며, 신청 전 자격과 최신 내용은 반드시 공식 기관에서 확인해 주세요.
        </p>
      </div>
    </main>
  );
}

function DetailSection({ title, value }: Readonly<{ title: string; value: string | null }>) {
  return (
    <section aria-labelledby={`${title}-title`}>
      <h2 className="text-lg font-semibold" id={`${title}-title`}>
        {title}
      </h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
        {value ?? "공식 안내에서 내용을 확인해 주세요."}
      </p>
    </section>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="mt-1 leading-6 text-muted-foreground">{value ?? "정보 없음"}</dd>
    </div>
  );
}
