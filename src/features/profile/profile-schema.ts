import { z } from "zod";

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "재직 중", value: "employed" },
  { label: "구직 중", value: "job_seeking" },
  { label: "미취업", value: "unemployed" },
  { label: "재학 중", value: "student" },
  { label: "자영업·프리랜서", value: "self_employed" },
  { label: "기타", value: "other" },
] as const;

export const REGION_OPTIONS = [
  { label: "서울특별시", value: "11" },
  { label: "부산광역시", value: "26" },
  { label: "대구광역시", value: "27" },
  { label: "인천광역시", value: "28" },
  { label: "광주광역시", value: "29" },
  { label: "대전광역시", value: "30" },
  { label: "울산광역시", value: "31" },
  { label: "세종특별자치시", value: "36" },
  { label: "경기도", value: "41" },
  { label: "충청북도", value: "43" },
  { label: "충청남도", value: "44" },
  { label: "전라남도", value: "46" },
  { label: "경상북도", value: "47" },
  { label: "경상남도", value: "48" },
  { label: "제주특별자치도", value: "50" },
  { label: "강원특별자치도", value: "51" },
  { label: "전북특별자치도", value: "52" },
] as const;

const employmentStatusSchema = z.enum(
  EMPLOYMENT_STATUS_OPTIONS.map((option) => option.value),
);
const regionCodeSchema = z.enum(REGION_OPTIONS.map((option) => option.value));

function emptyStringToNull(value: unknown): unknown {
  return value === "" ? null : value;
}

export function createProfileUpdateSchema(currentYear: number) {
  return z.object({
    birthYear: z.preprocess(
      emptyStringToNull,
      z.coerce.number().int().min(1900).max(currentYear).nullable(),
    ),
    emailOptIn: z.boolean(),
    employmentStatus: z.preprocess(
      emptyStringToNull,
      employmentStatusSchema.nullable(),
    ),
    regionCode: z.preprocess(emptyStringToNull, regionCodeSchema.nullable()),
  });
}

export const profileSchema = z.object({
  birth_year: z.number().int().nullable(),
  email_opt_in: z.boolean(),
  employment_status: employmentStatusSchema.nullable(),
  id: z.uuid(),
  notification_email: z.email().nullable(),
  notification_email_verified_at: z
    .iso.datetime({ local: true, offset: true })
    .nullable(),
  region_code: regionCodeSchema.nullable(),
  updated_at: z.iso.datetime({ local: true, offset: true }),
});

export type Profile = z.infer<typeof profileSchema>;

export function getCurrentSeoulYear(): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "numeric",
    }).format(new Date()),
  );
}
