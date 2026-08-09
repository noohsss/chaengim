import { formatYouthCenterEligibility } from "./adapters/normalize-utils";

export type PolicyFactInput = Readonly<{
  id: string;
  title: string;
  status: string;
  priority: string;
  summary: string | null;
  supportContent: string | null;
  eligibility: string | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  applicationPeriodText: string | null;
  isRolling: boolean;
  applicationMethod: string | null;
  applicationUrl: string | null;
  organizationName: string | null;
}>;

export type PolicyFact = Readonly<{
  id: string;
  title: string;
  status: string;
  priority: string;
  supportContent: string;
  eligibility: string;
  applicationPeriod: string;
  deadlineLabel: string;
  daysRemaining: number | null;
  applicationMethod: string;
  applicationUrl: string | null;
  organizationName: string;
}>;

export type PolicyComparisonRow = Readonly<{
  label: string;
  values: Readonly<Record<string, string>>;
}>;

const MISSING_SOURCE_VALUE = "원문에 정보 없음";

function daysBetweenSeoulDates(fromDate: string, toDate: string): number {
  const fromTime = Date.parse(`${fromDate}T00:00:00+09:00`);
  const toTime = Date.parse(`${toDate}T00:00:00+09:00`);
  return Math.round((toTime - fromTime) / 86_400_000);
}

function formatApplicationPeriod(input: PolicyFactInput): string {
  if (input.isRolling) return "상시 모집";
  if (input.applicationStartDate && input.applicationEndDate) {
    return `${input.applicationStartDate} ~ ${input.applicationEndDate}`;
  }
  if (input.applicationEndDate) return `~ ${input.applicationEndDate}`;
  return input.applicationPeriodText ?? MISSING_SOURCE_VALUE;
}

function getDeadline(input: PolicyFactInput, today: string): Readonly<{ label: string; daysRemaining: number | null }> {
  if (input.isRolling) return { label: "상시 모집", daysRemaining: null };
  if (!input.applicationEndDate) return { label: "마감일 확인 필요", daysRemaining: null };

  const daysRemaining = daysBetweenSeoulDates(today, input.applicationEndDate);
  if (daysRemaining < 0) return { label: "마감됨", daysRemaining };
  if (daysRemaining === 0) return { label: "오늘 마감", daysRemaining };
  return { label: `D-${daysRemaining}`, daysRemaining };
}

export function buildPolicyFact(input: PolicyFactInput, today: string): PolicyFact {
  const deadline = getDeadline(input, today);
  return {
    id: input.id,
    title: input.title,
    status: input.status,
    priority: input.priority,
    supportContent: input.supportContent ?? input.summary ?? MISSING_SOURCE_VALUE,
    eligibility: formatYouthCenterEligibility(input.eligibility) ?? MISSING_SOURCE_VALUE,
    applicationPeriod: formatApplicationPeriod(input),
    deadlineLabel: deadline.label,
    daysRemaining: deadline.daysRemaining,
    applicationMethod: input.applicationMethod ?? MISSING_SOURCE_VALUE,
    applicationUrl: input.applicationUrl,
    organizationName: input.organizationName ?? MISSING_SOURCE_VALUE,
  };
}

export function sortPolicyFactsForAction(facts: readonly PolicyFact[]): readonly PolicyFact[] {
  const priorityRank: Readonly<Record<string, number>> = { high: 0, normal: 1, low: 2 };
  return [...facts].sort((left, right) => {
    const priorityDifference = (priorityRank[left.priority] ?? 3) - (priorityRank[right.priority] ?? 3);
    if (priorityDifference !== 0) return priorityDifference;
    const leftDays = left.daysRemaining !== null && left.daysRemaining >= 0 ? left.daysRemaining : Number.POSITIVE_INFINITY;
    const rightDays = right.daysRemaining !== null && right.daysRemaining >= 0 ? right.daysRemaining : Number.POSITIVE_INFINITY;
    return leftDays - rightDays;
  });
}

export function buildPolicyComparisonRows(facts: readonly PolicyFact[]): readonly PolicyComparisonRow[] {
  const row = (label: string, value: (fact: PolicyFact) => string): PolicyComparisonRow => ({
    label,
    values: Object.fromEntries(facts.map((fact) => [fact.id, value(fact)])),
  });
  return [
    row("지원 내용", (fact) => fact.supportContent),
    row("신청 조건", (fact) => fact.eligibility),
    row("신청 기간", (fact) => fact.applicationPeriod),
    row("신청 방법", (fact) => fact.applicationMethod),
    row("담당 기관", (fact) => fact.organizationName),
  ];
}
