import type { PolicyCategory } from "../normalized-policy";

const PROVINCE_REGION_CODES = [
  ["서울", "11"],
  ["부산", "26"],
  ["대구", "27"],
  ["인천", "28"],
  ["광주", "29"],
  ["대전", "30"],
  ["울산", "31"],
  ["세종", "36"],
  ["경기", "41"],
  ["강원", "42"],
  ["충북", "43"],
  ["충청북도", "43"],
  ["충남", "44"],
  ["충청남도", "44"],
  ["전북", "45"],
  ["전라북도", "45"],
  ["전남", "46"],
  ["전라남도", "46"],
  ["경북", "47"],
  ["경상북도", "47"],
  ["경남", "48"],
  ["경상남도", "48"],
  ["제주", "50"],
] as const;

const CATEGORY_KEYWORDS: readonly [PolicyCategory, readonly string[]][] = [
  ["jobs_startup", ["일자리", "취업", "구직", "창업", "직무", "인턴"]],
  ["housing", ["주거", "전세", "월세", "임대", "주택", "부동산"]],
  ["education", ["교육", "장학", "학자금", "훈련", "학습", "학교"]],
  ["finance", ["금융", "저축", "대출", "자산", "소득", "채무"]],
  ["welfare_culture", ["복지", "문화", "예술", "건강", "생활", "심리"]],
  ["participation_rights", ["참여", "권리", "정책참여", "위원회", "네트워크"]],
];

const ROLLING_APPLICATION_PATTERN = /상시|수시|연중|예산\s*소진|마감\s*시/i;
const DATE_PATTERN = /(\d{4})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})/g;

export type DateRange = Readonly<{
  startDate?: string;
  endDate?: string;
  isRolling: boolean;
}>;

export function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

export function firstText(...values: readonly unknown[]): string | undefined {
  for (const value of values) {
    const cleaned = cleanText(value);

    if (cleaned) {
      return cleaned;
    }
  }

  return undefined;
}

export function joinTextSections(
  sections: ReadonlyArray<readonly [string, unknown]>,
): string | undefined {
  const joined = sections
    .flatMap(([label, value]) => {
      const cleaned = cleanText(value);
      return cleaned ? [`${label}\n${cleaned}`] : [];
    })
    .join("\n\n");

  return joined.length > 0 ? joined : undefined;
}

export function optionalUrl(value: unknown): string | undefined {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return undefined;
  }

  const parsedUrl = URL.canParse(cleaned) ? new URL(cleaned) : undefined;

  if (parsedUrl?.protocol === "http:" || parsedUrl?.protocol === "https:") {
    return parsedUrl.toString();
  }

  return undefined;
}

export function mapCategory(...values: readonly unknown[]): PolicyCategory {
  const haystack = values.flatMap((value) => cleanText(value) ?? []).join(" ");

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

export function mapRegionCodes(...values: readonly unknown[]): readonly string[] {
  const haystack = values.flatMap((value) => cleanText(value) ?? []).join(" ");
  const codes = PROVINCE_REGION_CODES.flatMap(([keyword, code]) =>
    haystack.includes(keyword) ? [code] : [],
  );

  return [...new Set(codes)].sort();
}

export function parseDateRange(value: unknown): DateRange {
  const periodText = cleanText(value);

  if (!periodText) {
    return { isRolling: false };
  }

  if (ROLLING_APPLICATION_PATTERN.test(periodText)) {
    return { isRolling: true };
  }

  const dates = Array.from(periodText.matchAll(DATE_PATTERN), (match) => {
    const [, year, month, day] = match;
    return formatDate(year, month, day);
  }).filter((date): date is string => Boolean(date));

  if (dates.length === 0) {
    return { isRolling: false };
  }

  const sortedDates = [...new Set(dates)].sort();

  return {
    startDate: sortedDates[0],
    endDate: sortedDates[sortedDates.length - 1],
    isRolling: false,
  };
}

function formatDate(
  year: string | undefined,
  month: string | undefined,
  day: string | undefined,
): string | undefined {
  if (!year || !month || !day) {
    return undefined;
  }

  const monthNumber = Number.parseInt(month, 10);
  const dayNumber = Number.parseInt(day, 10);

  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > 31
  ) {
    return undefined;
  }

  const date = new Date(
    Date.UTC(Number.parseInt(year, 10), monthNumber - 1, dayNumber),
  );

  if (
    date.getUTCFullYear().toString() !== year ||
    date.getUTCMonth() !== monthNumber - 1 ||
    date.getUTCDate() !== dayNumber
  ) {
    return undefined;
  }

  return `${year}-${monthNumber.toString().padStart(2, "0")}-${dayNumber
    .toString()
    .padStart(2, "0")}`;
}
