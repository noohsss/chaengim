import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { createClient } from "@/lib/supabase/server";
import { getAnalysis } from "@/server/ai/analysis";

import { requestAnalysis } from "./actions";

type AnalysisPageProps = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

function firstParam(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

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

        {status && status !== "completed" ? <p className="mt-4 text-sm text-destructive" role="alert">{status === "no_saved_policies" ? "먼저 정책을 챙겨 주세요." : status === "configuration" ? "AI 분석 설정이 아직 준비되지 않았어요." : "분석을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."}</p> : null}
        {status === "completed" ? <p className="mt-4 text-sm text-accent-foreground" role="status">최신 분석을 반영했어요.</p> : null}

        <section className="ui-card mt-8 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">최근 분석</h2>
              {analysis ? <p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(analysis.createdAt))}{analysis.isStale ? " · 챙김 정보가 바뀌어 오래된 결과예요" : ""}</p> : <p className="mt-2 text-sm text-muted-foreground">아직 분석 결과가 없어요.</p>}
            </div>
            <form action={requestAnalysis}><button className="ui-primary-action" type="submit">{analysis ? "다시 분석하기" : "분석 시작하기"}</button></form>
          </div>

          {result ? <div className="mt-8 grid gap-6">
            <p className="rounded-[var(--radius-control)] bg-secondary/60 p-4 text-sm leading-6">{result.overview}</p>
            {result.priorityPolicy ? <section><h3 className="font-semibold">먼저 확인할 정책</h3><p className="mt-2 text-sm leading-6"><strong>{analysis?.policyTitles[result.priorityPolicy.policyId] ?? "정책"}</strong> · {result.priorityPolicy.reason}</p></section> : null}
            {result.urgentPolicies.length > 0 ? <section><h3 className="font-semibold">마감이 가까운 정책</h3><ul className="mt-2 grid gap-2 text-sm leading-6">{result.urgentPolicies.map((item) => <li key={item.policyId}><strong>{analysis?.policyTitles[item.policyId] ?? "정책"}</strong> · {item.reason}</li>)}</ul></section> : null}
            {result.needsConfirmation.length > 0 ? <section><h3 className="font-semibold">추가 확인이 필요한 조건</h3><ul className="mt-2 grid gap-2 text-sm leading-6">{result.needsConfirmation.map((item) => <li key={`${item.policyId}-${item.reason}`}><strong>{analysis?.policyTitles[item.policyId] ?? "정책"}</strong> · {item.reason}</li>)}</ul></section> : null}
            {result.nextSteps.length > 0 ? <section><h3 className="font-semibold">다음 단계</h3><ol className="mt-2 grid gap-2 text-sm leading-6">{result.nextSteps.map((step) => <li key={step}>{step}</li>)}</ol></section> : null}
          </div> : null}
        </section>
        <Link className="mt-6 inline-flex text-sm font-medium text-primary" href="/my">내 챙김으로 돌아가기</Link>
      </div>
    </main>
  );
}
