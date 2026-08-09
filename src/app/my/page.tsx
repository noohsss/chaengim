import { CalendarDays, ExternalLink, Flag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import {
  APPLICATION_OUTCOME_OPTIONS,
  SAVED_POLICY_PRIORITY_OPTIONS,
  SAVED_POLICY_STATUS_OPTIONS,
} from "@/features/saved-policies/saved-policy-schema";
import { createClient } from "@/lib/supabase/server";
import { listSavedPolicies } from "@/server/saved-policies/policy-list";

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

const statusLabels: Readonly<Record<string, string>> = Object.fromEntries(
  SAVED_POLICY_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

type MyPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDeadline(item: {
  application_end_date: string | null;
  application_period_text: string | null;
  is_rolling: boolean;
}): string {
  if (item.is_rolling) return "상시 모집";
  if (item.application_end_date) return `${item.application_end_date} 마감`;
  return item.application_period_text ?? "신청 기간 확인 필요";
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
        <header>
          <Link aria-label="챙김 홈" href="/">
            <BrandLogo size="compact" />
          </Link>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="ui-eyebrow">내 챙김</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">챙긴 정책을 정리해 보세요</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                신청할 정책의 진행 상황과 우선순위를 한곳에서 관리할 수 있어요.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{visiblePolicies.length}개</span>
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
          <ul className="mt-8 grid gap-5 lg:grid-cols-2">
            {visiblePolicies.map((item) => {
              const policy = item.policies;
              if (!policy) return null;

              return (
                <li className="ui-card p-5" key={item.policy_id}>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">{categoryLabels[policy.category]}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" size={14} />{formatDeadline(policy)}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold"><Link className="hover:text-primary" href={`/policies/${policy.id}`}>{policy.title}</Link></h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{policy.summary ?? "지원 내용을 확인해 보세요."}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Flag aria-hidden="true" size={13} />{statusLabels[item.status]}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">우선순위 {SAVED_POLICY_PRIORITY_OPTIONS.find((option) => option.value === item.priority)?.label}</span>
                  </div>
                  <form action={updateSavedPolicy} className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                    <input name="policyId" type="hidden" value={item.policy_id} />
                    <input name="returnPath" type="hidden" value={currentPath} />
                    <label className="grid gap-2 text-sm font-medium">상태<select className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" defaultValue={item.status} name="status">{SAVED_POLICY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-medium">우선순위<select className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" defaultValue={item.priority} name="priority">{SAVED_POLICY_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-medium sm:col-span-2">메모<textarea className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue={item.memo ?? ""} maxLength={5000} name="memo" placeholder="신청 전에 확인할 내용을 적어 두세요." /></label>
                    <label className="grid gap-2 text-sm font-medium">신청 결과<select className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" defaultValue={item.outcome ?? ""} name="outcome"><option value="">선택하지 않음</option>{APPLICATION_OUTCOME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-medium">결과일<input className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" defaultValue={item.result_date ?? ""} name="resultDate" type="date" /></label>
                    <label className="grid gap-2 text-sm font-medium sm:col-span-2">결과 메모<textarea className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue={item.result_memo ?? ""} maxLength={5000} name="resultMemo" placeholder="결과와 관련된 메모를 남겨 주세요." /></label>
                    <button className="min-h-10 justify-self-start rounded-lg border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary" type="submit">변경 저장</button>
                  </form>
                  {policy.application_url ? <a className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary" href={policy.application_url} rel="noreferrer" target="_blank">공식 신청 페이지<ExternalLink aria-hidden="true" size={14} /></a> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
