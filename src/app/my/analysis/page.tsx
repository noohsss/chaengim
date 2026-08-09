import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AiSubmitButton } from "@/components/ai/ai-submit-button";
import { createClient } from "@/lib/supabase/server";
import { getAnalysis } from "@/server/ai/analysis";

import { requestAnalysis } from "./actions";

type AnalysisPageProps = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

function firstParam(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

const priorityLabels: Readonly<Record<string, string>> = { high: "높음", normal: "보통", low: "낮음" };
const statusLabels: Readonly<Record<string, string>> = {
  interested: "관심",
  reviewing: "확인 중",
  planning_to_apply: "신청 예정",
  applied: "신청 완료",
  result_recorded: "결과 기록",
};
const fitStatusLabels = {
  matches: "확인된 조건",
  needs_confirmation: "확인 필요",
  potential_mismatch: "불일치 가능성",
} as const;

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const params = await searchParams;
  const status = firstParam(params.status);
  const client = await createClient();
  const { data: claims } = await client.auth.getClaims();
  if (!z.uuid().safeParse(claims?.claims.sub).success) redirect("/login?next=/my/analysis");
  const analysis = await getAnalysis(client);
  const result = analysis?.result;

  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-4xl">
        <header className="rounded-[var(--radius)] bg-[var(--brand-sky)] p-6 sm:p-8">
          <Link aria-label="챙김 홈" href="/"><BrandLogo size="compact" /></Link>
          <p className="ui-eyebrow mt-10">내 챙김 분석</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">지금 먼저 확인할 정책을 정리해 드려요</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">챙긴 정책과 관리 정보를 바탕으로 다음 행동을 정리합니다. 최종 자격과 신청 결과는 공식 기관에서 확인해 주세요.</p>
        </header>

        {status && status !== "completed" ? <p className="mt-4 text-sm text-destructive" role="alert">{status === "no_saved_policies" ? "먼저 정책을 챙겨 주세요." : status === "configuration" ? "AI 분석 설정이 아직 준비되지 않았어요." : status === "rate_limited" ? "요청이 많아요. 잠시 후 다시 시도해 주세요." : "분석을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."}</p> : null}
        {status === "completed" ? <p className="mt-4 text-sm text-accent-foreground" role="status">최신 분석을 반영했어요.</p> : null}

        <section className="ui-card mt-8 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">최근 분석</h2>
              {analysis ? <p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(analysis.createdAt))}{analysis.isStale ? " · 챙김 정보가 바뀌어 오래된 결과예요" : ""}</p> : <p className="mt-2 text-sm text-muted-foreground">아직 분석 결과가 없어요.</p>}
            </div>
            <form action={requestAnalysis}>
              <AiSubmitButton
                idleLabel={analysis ? "다시 분석하기" : "분석 시작하기"}
                pendingLabel="AI 분석 중…"
              />
            </form>
          </div>

          {result && analysis ? <div className="mt-8 grid gap-8">
            <p className="rounded-[var(--radius-control)] bg-secondary/60 p-4 text-sm leading-6">{result.overview}</p>

            {analysis.profileMissingFields.length > 0 ? <aside className="rounded-[var(--radius-control)] border border-border p-4 text-sm leading-6"><strong>개인화에 필요한 정보:</strong> {analysis.profileMissingFields.join(", ")}가 비어 있어 일부 조건은 확인 필요로 표시됩니다. <Link className="font-medium text-primary" href="/settings">프로필 채우기</Link></aside> : null}

            <section>
              <div className="flex items-end justify-between gap-4"><div><p className="ui-eyebrow">오늘의 행동 순서</p><h3 className="mt-1 text-xl font-semibold">먼저 확인할 정책</h3></div><span className="text-xs text-muted-foreground">우선순위와 마감 기준</span></div>
              <ol className="mt-4 grid gap-4">
                {analysis.policyFacts.map((fact, index) => {
                  const aiReason = result.priorityPolicy?.policyId === fact.id
                    ? result.priorityPolicy.reason
                    : result.urgentPolicies.find((item) => item.policyId === fact.id)?.reason;
                  const recommendedAction = result.recommendedActions.find((item) => item.policyId === fact.id);
                  return <li className="rounded-[var(--radius-control)] border border-border p-5" key={fact.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold text-primary">{index + 1}순위 · {statusLabels[fact.status] ?? fact.status} · 우선순위 {priorityLabels[fact.priority] ?? fact.priority}</p><h4 className="mt-1 text-lg font-semibold">{fact.title}</h4>{aiReason ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{aiReason}</p> : null}</div><span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">{fact.deadlineLabel}</span></div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">신청 기간</dt><dd className="mt-1 text-muted-foreground">{fact.applicationPeriod}</dd></div><div><dt className="font-semibold">지원 내용</dt><dd className="mt-1 text-muted-foreground">{fact.supportContent}</dd></div><div className="sm:col-span-2"><dt className="font-semibold">확인할 조건</dt><dd className="mt-1 whitespace-pre-line text-muted-foreground">{fact.eligibility}</dd></div></dl>
                    {recommendedAction ? <p className="mt-4 rounded-[var(--radius-control)] bg-[var(--brand-mint)] p-3 text-sm leading-6"><strong>{recommendedAction.action}</strong> · {recommendedAction.reason}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2"><Link className="ui-secondary-action" href={`/policies/${fact.id}`}>상세 조건 확인</Link>{fact.applicationUrl ? <a className="ui-primary-action" href={fact.applicationUrl} rel="noreferrer" target="_blank">공식 페이지 열기</a> : null}</div>
                  </li>;
                })}
              </ol>
            </section>

            {result.fitChecks.length > 0 ? <section><h3 className="text-lg font-semibold">프로필 기준 조건 점검</h3><ul className="mt-3 grid gap-3 sm:grid-cols-2">{result.fitChecks.map((check) => <li className="rounded-[var(--radius-control)] border border-border p-4" key={`${check.policyId}-${check.criterion}`}><p className="text-xs font-semibold text-primary">{fitStatusLabels[check.status]}</p><p className="mt-1 font-semibold">{analysis.policyTitles[check.policyId] ?? "정책"} · {check.criterion}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{check.reason}</p></li>)}</ul></section> : result.needsConfirmation.length > 0 ? <section><h3 className="text-lg font-semibold">추가 확인이 필요한 조건</h3><ul className="mt-2 grid gap-2 text-sm leading-6">{result.needsConfirmation.map((item) => <li key={`${item.policyId}-${item.reason}`}><strong>{analysis.policyTitles[item.policyId] ?? "정책"}</strong> · {item.reason}</li>)}</ul></section> : null}

            {result.recommendedActions.length === 0 && result.nextSteps.length > 0 ? <section><h3 className="text-lg font-semibold">다음 단계</h3><ol className="mt-2 grid gap-2 text-sm leading-6">{result.nextSteps.map((step, index) => <li key={`${index}-${step}`}>{index + 1}. {step}</li>)}</ol></section> : null}
          </div> : null}
        </section>
        <Link className="mt-6 inline-flex text-sm font-medium text-primary" href="/my">내 챙김으로 돌아가기</Link>
      </div>
    </main>
  );
}
