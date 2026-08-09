import { createClient } from "@/lib/supabase/server";
import {
  listPublicPolicies,
  type PolicySearchParams,
} from "@/server/policies/policy-query";

const categoryLabels: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

type HomePageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toSearchParams(
  params: Record<string, string | string[] | undefined>,
): PolicySearchParams {
  return {
    search: firstParam(params.search),
    category: firstParam(params.category),
    region: firstParam(params.region),
  };
}

function formatDeadline(policy: {
  application_end_date: string | null;
  application_period_text: string | null;
  is_rolling: boolean;
}): string {
  if (policy.is_rolling) return "상시 모집";
  if (policy.application_end_date) return `${policy.application_end_date} 마감`;
  return policy.application_period_text ?? "신청 기간 확인 필요";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = toSearchParams(await searchParams);
  const policies = await listPublicPolicies(await createClient(), filters);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <header>
        <p className="text-sm font-semibold text-blue-700">챙김</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          받을 수 있는 혜택, 놓치지 않게.
        </h1>
        <p className="mt-3 text-neutral-600">
          정부와 지자체의 청년 정책을 한 곳에서 찾아보세요.
        </p>
      </header>

      <form className="mt-10 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_140px_auto]">
        <label className="sr-only" htmlFor="search">
          정책 검색
        </label>
        <input
          id="search"
          name="search"
          defaultValue={filters.search}
          placeholder="정책명으로 검색"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <label className="sr-only" htmlFor="category">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          defaultValue={filters.category ?? ""}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="region">
          시·도 코드
        </label>
        <input
          id="region"
          name="region"
          defaultValue={filters.region}
          placeholder="지역 코드"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          검색
        </button>
      </form>

      <section className="mt-12" aria-labelledby="policy-list-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="policy-list-title" className="text-2xl font-semibold">
              지금 확인할 정책
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              마감이 가까운 순으로 보여드려요.
            </p>
          </div>
          <span className="text-sm text-neutral-500">{policies.length}개</span>
        </div>

        {policies.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center text-sm text-neutral-500">
            조건에 맞는 정책이 없습니다. 검색어와 필터를 바꿔보세요.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {policies.map((policy) => (
              <li
                key={policy.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                  <span>{categoryLabels[policy.category]}</span>
                  <span>{formatDeadline(policy)}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{policy.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
                  {policy.summary ?? "지원 내용을 확인해보세요."}
                </p>
                {policy.organization_name ? (
                  <p className="mt-4 text-xs text-neutral-500">
                    {policy.organization_name}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
