import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
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
          <Link aria-label="챙김 홈" href="/"><BrandLogo size="compact" /></Link>
          <p className="ui-eyebrow mt-10">정책 비교</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">챙긴 정책을 나란히 비교해 보세요</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">지원 내용, 조건, 기간의 차이를 정리해 드려요. 최종 자격은 공식 기관에서 확인해 주세요.</p>
        </header>

        {status ? <p className={`mt-4 text-sm ${status === "completed" ? "text-accent-foreground" : "text-destructive"}`} role={status === "completed" ? "status" : "alert"}>{status === "completed" ? "최신 비교를 반영했어요." : status === "invalid_selection" ? "정책을 2~3개 선택해 주세요." : status === "no_saved_policies" ? "먼저 비교할 정책을 챙겨 주세요." : "비교를 완료하지 못했어요. 잠시 후 다시 시도해 주세요."}</p> : null}

        <section className="ui-card mt-8 p-6 sm:p-8">
          <form action={requestComparison}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-xl font-semibold">비교할 정책 선택</h2><p className="mt-2 text-sm text-muted-foreground">정확히 2~3개를 선택할 수 있어요.</p></div>
              <button className="ui-primary-action" type="submit">선택한 정책 비교하기</button>
            </div>
            {options.length === 0 ? <p className="mt-8 rounded-[var(--radius-control)] border border-dashed p-6 text-center text-sm text-muted-foreground">아직 챙긴 정책이 없어요.</p> : <ul className="mt-6 grid gap-3 sm:grid-cols-2">{options.map((option) => <li key={option.id}><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-border p-4 transition-colors hover:bg-secondary/60"><input className="size-5 accent-primary" name="policyId" type="checkbox" value={option.id} defaultChecked={selectedIds.includes(option.id)} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{option.title}</span><span className="mt-1 block text-xs text-muted-foreground">{categoryLabels[option.category] ?? "기타"}</span></span></label></li>)}</ul>}
          </form>
        </section>

        {comparison && result ? <section className="ui-card mt-6 p-6 sm:p-8"><h2 className="text-xl font-semibold">최근 비교</h2><p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(comparison.createdAt))}{comparison.isStale ? " · 선택한 정책 정보가 바뀌어 오래된 결과예요" : ""}</p><p className="mt-6 rounded-[var(--radius-control)] bg-secondary/60 p-4 text-sm leading-6">{result.overview}</p><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3 font-semibold">비교 항목</th>{selectedIds.map((id) => <th className="p-3 font-semibold" key={id}>{comparison.policyTitles[id] ?? "정책"}</th>)}<th className="p-3 font-semibold">차이</th></tr></thead><tbody>{result.comparisonRows.map((row) => <tr className="border-b border-border last:border-0" key={row.label}><th className="p-3 align-top font-semibold">{row.label}</th>{selectedIds.map((id) => <td className="p-3 align-top leading-6" key={id}>{row.values.find((value) => value.policyId === id)?.value ?? "-"}</td>)}<td className="p-3 align-top leading-6">{row.difference}</td></tr>)}</tbody></table></div><p className="mt-6 text-sm leading-6"><strong>먼저 확인할 정책:</strong> {comparison.policyTitles[result.priorityPolicy.policyId] ?? "정책"} · {result.priorityPolicy.reason}</p>{result.needsConfirmation.length > 0 ? <div className="mt-5"><h3 className="font-semibold">추가 확인이 필요한 조건</h3><ul className="mt-2 grid gap-2 text-sm leading-6">{result.needsConfirmation.map((item) => <li key={`${item.policyId}-${item.reason}`}><strong>{comparison.policyTitles[item.policyId] ?? "정책"}</strong> · {item.reason}</li>)}</ul></div> : null}</section> : null}
        <Link className="mt-6 inline-flex text-sm font-medium text-primary" href="/my">내 챙김으로 돌아가기</Link>
      </div>
    </main>
  );
}
