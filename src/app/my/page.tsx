import { ChevronDown, ExternalLink, Flag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { PolicySummaryCard } from "@/components/policies/policy-summary-card";
import {
  APPLICATION_OUTCOME_OPTIONS,
  SAVED_POLICY_PRIORITY_OPTIONS,
  SAVED_POLICY_STATUS_OPTIONS,
} from "@/features/saved-policies/saved-policy-schema";
import { createClient } from "@/lib/supabase/server";
import { listSavedPolicies } from "@/server/saved-policies/policy-list";

import { updateSavedPolicy } from "./actions";

const statusLabels: Readonly<Record<string, string>> = Object.fromEntries(
  SAVED_POLICY_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

type MyPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = await searchParams;
  const status = firstParam(params.status);
  const priority = firstParam(params.priority);
  const returnPath = new URLSearchParams();
  if (status) returnPath.set("status", status);
  if (priority) returnPath.set("priority", priority);
  const currentPath = returnPath.toString() ? `/my?${returnPath}` : "/my";
  const client = await createClient();
  const { data: claims } = await client.auth.getClaims();
  if (!z.uuid().safeParse(claims?.claims.sub).success) redirect(`/login?next=${encodeURIComponent(currentPath)}`);

  const savedPolicies = await listSavedPolicies(client, { priority, status });
  const visiblePolicies = savedPolicies.filter((item) => item.policies !== null);

  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-5xl">
        <header className="rounded-[var(--radius)] bg-[var(--brand-sky)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link aria-label="챙김 홈" href="/">
              <BrandLogo size="compact" />
            </Link>
            <PageBackButton fallbackHref="/" />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="ui-eyebrow">내 챙김</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">챙긴 정책을 정리해 보세요</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                신청할 정책의 진행 상황과 우선순위를 한곳에서 관리할 수 있어요.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">{visiblePolicies.length}개</span>
              <Link className="ui-secondary-action" href="/my/analysis">
                내 챙김 분석
              </Link>
              <Link className="ui-secondary-action" href="/my/compare">
                정책 비교
              </Link>
            </div>
          </div>
        </header>

        <form className="ui-card mt-8 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]" method="get">
          <label className="grid gap-2 text-sm font-medium">
            진행 상태
            <select className="ui-control" defaultValue={status ?? ""} name="status">
              <option value="">전체 상태</option>
              {SAVED_POLICY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            우선순위
            <select className="ui-control" defaultValue={priority ?? ""} name="priority">
              <option value="">전체 우선순위</option>
              {SAVED_POLICY_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="ui-primary-action self-end" type="submit">적용</button>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">마감일이 빠른 순으로 정렬하고 있어요.</p>

        {params.status === "updated" ? <p className="mt-4 text-sm text-accent-foreground" role="status">변경 내용을 저장했어요.</p> : null}
        {params.status === "result_required" ? <p className="mt-4 text-sm text-destructive" role="alert">결과 기록을 저장하려면 신청 결과를 선택해 주세요.</p> : null}
        {params.status === "update_failed" ? <p className="mt-4 text-sm text-destructive" role="alert">변경 내용을 저장하지 못했어요. 다시 시도해 주세요.</p> : null}

        {visiblePolicies.length === 0 ? (
          <section className="ui-card mt-8 border-dashed px-6 py-16 text-center shadow-none">
            <h2 className="font-semibold">아직 챙긴 정책이 없어요</h2>
            <p className="mt-2 text-sm text-muted-foreground">관심 있는 정책을 챙기면 여기에서 진행 상황을 관리할 수 있어요.</p>
            <Link className="ui-primary-action mt-6" href="/#policies">정책 찾아보기</Link>
          </section>
        ) : (
          <ul className="mt-8 grid gap-5">
            {visiblePolicies.map((item) => {
              const policy = item.policies;
              if (!policy) return null;

              return (
                <li key={item.policy_id}>
                  <PolicySummaryCard
                    actionLabel="상세 보기"
                    applicationEndDate={policy.application_end_date}
                    applicationPeriodText={policy.application_period_text}
                    category={policy.category}
                    href={`/policies/${policy.id}`}
                    isRolling={policy.is_rolling}
                    isSaved
                    supportContent={policy.support_content}
                    title={policy.title}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Flag aria-hidden="true" size={13} />
                        {statusLabels[item.status]}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        우선순위 {SAVED_POLICY_PRIORITY_OPTIONS.find((option) => option.value === item.priority)?.label}
                      </span>
                    </div>

                    <details className="group mt-5 overflow-hidden rounded-[var(--radius-control)] border border-border bg-background">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 [&::-webkit-details-marker]:hidden">
                        관리 정보 수정
                        <ChevronDown
                          aria-hidden="true"
                          className="transition-transform group-open:rotate-180"
                          size={18}
                        />
                      </summary>
                      <form action={updateSavedPolicy} className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                        <input name="policyId" type="hidden" value={item.policy_id} />
                        <input name="returnPath" type="hidden" value={currentPath} />
                        <label className="grid gap-2 text-sm font-medium">상태<select className="ui-control" defaultValue={item.status} name="status">{SAVED_POLICY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label className="grid gap-2 text-sm font-medium">우선순위<select className="ui-control" defaultValue={item.priority} name="priority">{SAVED_POLICY_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label className="grid gap-2 text-sm font-medium sm:col-span-2">메모<textarea className="ui-control min-h-24" defaultValue={item.memo ?? ""} maxLength={5000} name="memo" placeholder="신청 전에 확인할 내용을 적어 두세요." /></label>
                        <label className="grid gap-2 text-sm font-medium">신청 결과<select className="ui-control" defaultValue={item.outcome ?? ""} name="outcome"><option value="">선택하지 않음</option>{APPLICATION_OUTCOME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label className="grid gap-2 text-sm font-medium">결과일<input className="ui-control" defaultValue={item.result_date ?? ""} name="resultDate" type="date" /></label>
                        <label className="grid gap-2 text-sm font-medium sm:col-span-2">결과 메모<textarea className="ui-control min-h-24" defaultValue={item.result_memo ?? ""} maxLength={5000} name="resultMemo" placeholder="결과와 관련된 메모를 남겨 주세요." /></label>
                        <button className="ui-primary-action justify-self-start" type="submit">변경 저장</button>
                      </form>
                    </details>

                    {policy.application_url ? <a className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary" href={policy.application_url} rel="noreferrer" target="_blank">공식 신청 페이지<ExternalLink aria-hidden="true" size={14} /></a> : null}
                  </PolicySummaryCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
