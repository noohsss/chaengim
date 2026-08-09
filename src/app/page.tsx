import { BrandLogo } from "@/components/brand/brand-logo";
import { AccountMenu } from "@/components/navigation/account-menu";
import { REGION_OPTIONS } from "@/features/profile/profile-schema";
import { createClient } from "@/lib/supabase/server";
import {
  listPublicPolicies,
  type PolicySearchParams,
} from "@/server/policies/policy-query";
import {
  ArrowDown,
  BellRing,
  BookmarkCheck,
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const categoryLabels: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

const featureItems = [
  {
    description: "정부와 지자체의 청년 정책을 한곳에서 조건별로 살펴봐요.",
    icon: Search,
    label: "찾고",
    title: "흩어진 정책을 빠르게",
  },
  {
    description: "관심 정책을 챙기고 신청 상태와 해야 할 일을 이어서 관리해요.",
    icon: BookmarkCheck,
    label: "챙기고",
    title: "내 진행 상황을 한눈에",
  },
  {
    description: "복잡한 조건과 마감을 정리해 다음에 확인할 행동을 놓치지 않아요.",
    icon: Sparkles,
    label: "정리하고",
    title: "다음 행동을 분명하게",
  },
] as const;

type HomePageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toSearchParams(
  params: Record<string, string | string[] | undefined>,
): PolicySearchParams {
  const pageValue = Number(firstParam(params.page));

  return {
    search: firstParam(params.search),
    category: firstParam(params.category),
    region: firstParam(params.region),
    page: Number.isInteger(pageValue) && pageValue >= 1 ? pageValue : 1,
  };
}

function pageHref(filters: PolicySearchParams, page: number): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.region) params.set("region", filters.region);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/?${query}#policies` : "/#policies";
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
  const params = await searchParams;
  const filters = toSearchParams(params);
  const isAccountDeleted = z
    .enum(["account_deleted"])
    .safeParse(params.status).success;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = z.uuid().safeParse(claimsData?.claims.sub).success;
  const policyPage = await listPublicPolicies(supabase, filters);
  const { policies } = policyPage;

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative bg-[linear-gradient(150deg,var(--brand-sky)_0%,#fff_52%,var(--brand-mint)_100%)]">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-20 size-72 rounded-full bg-white/60 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-6 sm:pb-28 sm:pt-8">
          <nav className="flex items-center justify-between" aria-label="주요 메뉴">
            <Link aria-label="챙김 홈" href="/">
              <BrandLogo priority size="compact" />
            </Link>
            <div className="flex items-center gap-1 sm:gap-3">
              <a
                className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground sm:flex"
                href="#how-it-works"
              >
                이용 방법
              </a>
              {isAuthenticated ? (
                <AccountMenu />
              ) : (
                <Link
                  className="flex min-h-11 items-center rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
                  href="/login"
                >
                  로그인
                </Link>
              )}
            </div>
          </nav>

          {isAccountDeleted ? (
            <p
              className="mt-5 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground"
              role="status"
            >
              회원 탈퇴가 완료됐어요.
            </p>
          ) : null}

          <div className="grid items-center gap-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pt-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-sm font-semibold text-secondary-foreground shadow-sm backdrop-blur">
                <Check aria-hidden="true" size={16} strokeWidth={2.5} />
                필요한 혜택을 놓치지 않도록
              </p>
              <h1 className="mt-6 max-w-2xl text-[2.75rem] font-semibold leading-[1.12] tracking-[-0.045em] text-foreground sm:text-6xl sm:leading-[1.08]">
                정책은 복잡해도,
                <br />
                <span className="text-primary">챙기는 일은 쉽게.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                나에게 필요한 청년 정책을 찾고, 관심 정책의 신청 과정과
                다음 행동을 한곳에서 이어서 관리하세요.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(37,99,216,0.22)] transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
                  href="#policies"
                >
                  정책 둘러보기
                  <ArrowDown aria-hidden="true" size={18} />
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white bg-white/80 px-6 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-white"
                  href="#how-it-works"
                >
                  챙김 알아보기
                  <ChevronRight aria-hidden="true" size={18} />
                </a>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                로그인 없이 정책을 먼저 둘러볼 수 있어요.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2.5rem] bg-white/35 blur-2xl"
              />
              <div className="relative rotate-[1.5deg] rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_28px_80px_rgba(68,93,130,0.18)] backdrop-blur sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary">내 챙김</p>
                    <p className="mt-1 text-lg font-semibold">이번 주 확인할 일</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                    <BellRing aria-hidden="true" size={20} />
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <article className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--destructive)_9%,white)] px-2.5 py-1 text-xs font-semibold text-destructive">
                        마감 임박
                      </span>
                      <span className="text-xs text-muted-foreground">3일 남음</span>
                    </div>
                    <h2 className="mt-3 font-semibold">청년 주거비 지원</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      신청 서류와 소득 조건을 확인해 보세요.
                    </p>
                  </article>
                  <article className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check aria-hidden="true" size={18} strokeWidth={2.5} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">취업 준비 지원금</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          신청 예정으로 정리했어요
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">
                  <Sparkles aria-hidden="true" className="shrink-0" size={17} />
                  다음에 확인할 조건을 차근차근 정리해 드려요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
        id="how-it-works"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">챙김이 도와드려요</p>
          <h2
            className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            id="how-it-works-title"
          >
            발견에서 신청까지, 흐름이 끊기지 않게
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            정책을 찾은 순간부터 결과를 기록할 때까지 필요한 정보를 한곳에
            모아요.
          </p>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {featureItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                className="relative rounded-2xl border bg-card p-6 shadow-[0_12px_36px_rgba(37,42,51,0.06)]"
                key={item.label}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span className="text-sm font-semibold text-[var(--brand-cornflower)]">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-6 text-sm font-semibold text-primary">
                  {item.label}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bg-foreground text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center sm:py-20">
          <div>
            <p className="text-sm font-semibold text-[var(--brand-cornflower)]">
              믿고 확인할 수 있도록
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
              판단은 돕고,
              <br />
              결정은 서두르지 않아요.
            </h2>
          </div>
          <div className="grid gap-4 text-sm leading-6 text-white/75 sm:grid-cols-2">
            <p className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 shrink-0 text-[var(--brand-cornflower)]" size={17} />
              정부·지자체의 공식 출처와 최근 갱신 정보를 함께 보여드려요.
            </p>
            <p className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 shrink-0 text-[var(--brand-cornflower)]" size={17} />
              자격을 단정하지 않고 공식 기관에서 확인할 조건을 안내해요.
            </p>
          </div>
        </div>
      </section>

      <section
        className="scroll-mt-6 bg-[var(--brand-off-white)]"
        id="policies"
        aria-labelledby="policy-list-title"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">정책 탐색</p>
            <h2
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              id="policy-list-title"
            >
              지금 확인할 정책을 찾아보세요
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              관심 분야와 지역을 선택하면 신청 가능한 정책을 마감이 가까운
              순서로 보여드려요.
            </p>
          </div>

          <form
            action="#policies"
            className="mt-10 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_180px_140px_auto]"
          >
            <label className="sr-only" htmlFor="search">
              정책 검색
            </label>
            <input
              className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-secondary"
              defaultValue={filters.search}
              id="search"
              name="search"
              placeholder="정책명으로 검색"
            />
            <label className="sr-only" htmlFor="category">
              카테고리
            </label>
            <select
              className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-secondary"
              defaultValue={filters.category ?? ""}
              id="category"
              name="category"
            >
              <option value="">전체 카테고리</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="region">
              지역
            </label>
            <select
              className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-secondary"
              defaultValue={filters.region}
              id="region"
              name="region"
            >
              <option value="">전체 지역</option>
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
              type="submit"
            >
              검색
            </button>
          </form>

          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">마감이 가까운 정책</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                놓치기 전에 신청 조건을 확인해 보세요.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{policyPage.totalCount}개</span>
          </div>

          {policies.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <p className="font-medium">조건에 맞는 정책이 아직 없어요.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                검색어와 필터를 바꾸면 다른 정책을 확인할 수 있어요.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {policies.map((policy) => (
                <li
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
                  key={policy.id}
                >
                  <Link
                    className="block rounded-xl focus-visible:outline-none"
                    href={`/policies/${policy.id}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
                      {categoryLabels[policy.category]}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays aria-hidden="true" size={14} />
                      {formatDeadline(policy)}
                    </span>
                    </div>
                    <h4 className="mt-3 text-lg font-semibold">{policy.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {policy.summary ?? "지원 내용을 확인해 보세요."}
                    </p>
                    {policy.organization_name ? (
                      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin aria-hidden="true" size={14} />
                        {policy.organization_name}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {policyPage.totalPages > 1 ? (
            <nav
              aria-label="정책 목록 페이지"
              className="mt-8 flex items-center justify-center gap-2"
            >
              {policyPage.page > 1 ? (
                <Link
                  className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  href={pageHref(filters, policyPage.page - 1)}
                >
                  이전
                </Link>
              ) : null}
              <span className="px-2 text-sm text-muted-foreground">
                {policyPage.page} / {policyPage.totalPages}
              </span>
              {policyPage.page < policyPage.totalPages ? (
                <Link
                  className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  href={pageHref(filters, policyPage.page + 1)}
                >
                  다음
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo size="compact" />
          <p className="max-w-xl text-xs leading-5 text-muted-foreground sm:text-right">
            정책 정보는 참고용이며, 신청 전 자격과 최신 내용은 반드시 공식
            기관에서 확인해 주세요.
          </p>
        </div>
      </footer>
    </main>
  );
}
