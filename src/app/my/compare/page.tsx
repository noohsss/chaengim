import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AiSubmitButton } from "@/components/ai/ai-submit-button";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { createClient } from "@/lib/supabase/server";
import { ComparisonError, getComparison, getComparisonOptions } from "@/server/ai/comparison";

import { requestComparison } from "./actions";

type ComparePageProps = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

function firstParam(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

const categoryLabels: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const status = firstParam(params.status);
  const idsParam = firstParam(params.ids) ?? "";
  const selectedIds = idsParam.split(",").filter((id) => z.uuid().safeParse(id).success);
  const client = await createClient();
  const { data: claims } = await client.auth.getClaims();
  if (!z.uuid().safeParse(claims?.claims.sub).success) redirect("/login?next=/my/compare");
  const options = await getComparisonOptions(client);
  let comparison;
  try { comparison = selectedIds.length >= 2 && selectedIds.length <= 3 ? await getComparison(client, selectedIds) : undefined; } catch (error: unknown) {
    if (error instanceof ComparisonError && error.code === "invalid_selection") comparison = undefined;
    else throw error;
  }
  const result = comparison?.result;

  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-5xl">
        <header className="rounded-[var(--radius)] bg-[var(--brand-sky)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link aria-label="챙김 홈" href="/"><BrandLogo size="compact" /></Link>
            <PageBackButton fallbackHref="/my" />
          </div>
          <p className="ui-eyebrow mt-10">정책 비교</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">챙긴 정책을 나란히 비교해 보세요</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">지원 내용, 조건, 기간의 차이를 정리해 드려요. 최종 자격은 공식 기관에서 확인해 주세요.</p>
        </header>

        {status ? <p className={`mt-4 text-sm ${status === "completed" ? "text-accent-foreground" : "text-destructive"}`} role={status === "completed" ? "status" : "alert"}>{status === "completed" ? "최신 비교를 반영했어요." : status === "invalid_selection" ? "정책을 2~3개 선택해 주세요." : status === "no_saved_policies" ? "먼저 비교할 정책을 챙겨 주세요." : status === "rate_limited" ? "요청이 많아요. 잠시 후 다시 시도해 주세요." : "비교를 완료하지 못했어요. 잠시 후 다시 시도해 주세요."}</p> : null}

        <section className="ui-card mt-8 p-6 sm:p-8">
          <form action={requestComparison}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-xl font-semibold">비교할 정책 선택</h2><p className="mt-2 text-sm text-muted-foreground">정확히 2~3개를 선택할 수 있어요.</p></div>
              <AiSubmitButton idleLabel="선택한 정책 비교하기" pendingLabel="AI 비교 중…" />
            </div>
            {options.length === 0 ? <p className="mt-8 rounded-[var(--radius-control)] border border-dashed p-6 text-center text-sm text-muted-foreground">아직 챙긴 정책이 없어요.</p> : <ul className="mt-6 grid gap-3 sm:grid-cols-2">{options.map((option) => <li key={option.id}><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-border p-4 transition-colors hover:bg-secondary/60"><input className="size-5 accent-primary" name="policyId" type="checkbox" value={option.id} defaultChecked={selectedIds.includes(option.id)} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{option.title}</span><span className="mt-1 block text-xs text-muted-foreground">{categoryLabels[option.category] ?? "기타"}</span></span></label></li>)}</ul>}
          </form>
        </section>

        {comparison && result ? <section className="ui-card mt-6 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="ui-eyebrow">의사결정 요약</p><h2 className="mt-1 text-xl font-semibold">최근 비교</h2><p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(comparison.createdAt))}{comparison.isStale ? " · 정책 정보가 바뀌어 다시 비교가 필요해요" : ""}</p></div>{comparison.isStale ? <form action={requestComparison}>{selectedIds.map((id) => <input key={id} name="policyId" type="hidden" value={id} />)}<AiSubmitButton idleLabel="최신 정보로 다시 비교" pendingLabel="AI 비교 중…" /></form> : null}</div>
          <p className="mt-6 rounded-[var(--radius-control)] bg-secondary/60 p-4 text-sm leading-6">{result.overview}</p>

          <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3 font-semibold">비교 항목</th>{selectedIds.map((id) => <th className="p-3 font-semibold" key={id}><Link className="text-primary" href={`/policies/${id}`}>{comparison.policyTitles[id] ?? "정책"}</Link></th>)}<th className="p-3 font-semibold">핵심 차이</th></tr></thead><tbody>{comparison.sourceRows.map((row) => { const aiDifference = result.comparisonRows.find((item) => item.label === row.label)?.difference; return <tr className="border-b border-border last:border-0" key={row.label}><th className="p-3 align-top font-semibold">{row.label}</th>{selectedIds.map((id) => <td className="whitespace-pre-line p-3 align-top leading-6" key={id}>{row.values[id] ?? "원문에 정보 없음"}</td>)}<td className="p-3 align-top leading-6 text-muted-foreground">{aiDifference ?? "원문 정보를 직접 확인해 주세요."}</td></tr>; })}</tbody></table></div>

          <section className="mt-8"><h3 className="text-lg font-semibold">정책별 판단 포인트</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{comparison.policyFacts.map((fact) => { const assessment = result.policyAssessments.find((item) => item.policyId === fact.id); return <article className="rounded-[var(--radius-control)] border border-border p-4" key={fact.id}><div className="flex items-start justify-between gap-3"><h4 className="font-semibold">{fact.title}</h4><span className="shrink-0 text-sm font-semibold text-primary">{fact.deadlineLabel}</span></div>{assessment ? <><p className="mt-4 text-xs font-semibold text-primary">장점</p><ul className="mt-1 grid gap-1 text-sm leading-6">{assessment.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul><p className="mt-3 text-xs font-semibold text-destructive">주의점</p><ul className="mt-1 grid gap-1 text-sm leading-6">{assessment.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul></> : <p className="mt-3 text-sm leading-6 text-muted-foreground">새로 비교하면 정책별 장점과 주의점을 확인할 수 있어요.</p>}<div className="mt-4 flex flex-wrap gap-2"><Link className="ui-secondary-action" href={`/policies/${fact.id}`}>상세 보기</Link>{fact.applicationUrl ? <a className="ui-primary-action" href={fact.applicationUrl} rel="noreferrer" target="_blank">공식 페이지</a> : null}</div></article>; })}</div></section>

          <p className="mt-8 rounded-[var(--radius-control)] bg-[var(--brand-mint)] p-4 text-sm leading-6"><strong>먼저 확인할 정책:</strong> {comparison.policyTitles[result.priorityPolicy.policyId] ?? "정책"} · {result.priorityPolicy.reason}</p>
          {result.needsConfirmation.length > 0 ? <div className="mt-6"><h3 className="text-lg font-semibold">추가 확인이 필요한 조건</h3><ul className="mt-2 grid gap-2 text-sm leading-6">{result.needsConfirmation.map((item) => <li key={`${item.policyId}-${item.reason}`}><strong>{comparison.policyTitles[item.policyId] ?? "정책"}</strong> · {item.reason}</li>)}</ul></div> : null}
        </section> : null}
        <Link className="mt-6 inline-flex text-sm font-medium text-primary" href="/my">내 챙김으로 돌아가기</Link>
      </div>
    </main>
  );
}
