import { z } from "zod";

import {
  finalizeNormalizedPolicy,
  type NormalizedPolicy,
} from "../normalized-policy";
import {
  firstText,
  joinTextSections,
  mapCategory,
  mapRegionCodes,
  optionalUrl,
  parseDateRange,
} from "./normalize-utils";

export const gov24ServiceDetailSchema = z
  .object({
    서비스ID: z.string().trim().min(1),
    서비스명: z.string().trim().min(1),
    서비스목적: z.string().optional(),
    신청기한: z.string().optional(),
    지원대상: z.string().optional(),
    선정기준: z.string().optional(),
    지원내용: z.string().optional(),
    신청방법: z.string().optional(),
    구비서류: z.string().optional(),
    접수기관명: z.string().optional(),
    문의처: z.string().optional(),
    온라인신청사이트URL: z.string().optional(),
    수정일시: z.string().optional(),
    소관기관명: z.string().optional(),
    행정규칙: z.string().optional(),
    자치법규: z.string().optional(),
    법령: z.string().optional(),
  })
  .passthrough();

export const gov24ServiceListItemSchema = z
  .object({
    서비스ID: z.string().trim().min(1),
    서비스명: z.string().trim().min(1),
    서비스목적요약: z.string().optional(),
    지원대상: z.string().optional(),
    선정기준: z.string().optional(),
    지원내용: z.string().optional(),
    신청방법: z.string().optional(),
    신청기한: z.string().optional(),
    상세조회URL: z.string().optional(),
    소관기관명: z.string().optional(),
    서비스분야: z.string().optional(),
    접수기관: z.string().optional(),
    전화문의: z.string().optional(),
  })
  .passthrough();

export const gov24SupportConditionsSchema = z
  .object({
    서비스ID: z.string().trim().min(1),
    서비스명: z.string().optional(),
    JA0110: z.number().int().optional(),
    JA0111: z.number().int().optional(),
    JA0320: z.string().optional(),
    JA0326: z.string().optional(),
    JA0327: z.string().optional(),
    JA1101: z.string().optional(),
  })
  .passthrough();

export type Gov24ServiceDetail = z.infer<typeof gov24ServiceDetailSchema>;
export type Gov24ServiceListItem = z.infer<typeof gov24ServiceListItemSchema>;
export type Gov24SupportConditions = z.infer<
  typeof gov24SupportConditionsSchema
>;

type NormalizeGov24PolicyInput = Readonly<{
  detail: unknown;
  listItem?: unknown;
  supportConditions?: unknown;
}>;

export function normalizeGov24Policy(
  input: NormalizeGov24PolicyInput,
): NormalizedPolicy {
  const detail = gov24ServiceDetailSchema.parse(input.detail);
  const listItem = input.listItem
    ? gov24ServiceListItemSchema.parse(input.listItem)
    : undefined;
  const supportConditions = input.supportConditions
    ? gov24SupportConditionsSchema.parse(input.supportConditions)
    : undefined;
  const applicationPeriodText = firstText(detail.신청기한, listItem?.신청기한);
  const dateRange = parseDateRange(applicationPeriodText);
  const eligibility = joinTextSections([
    ["지원대상", firstText(detail.지원대상, listItem?.지원대상)],
    ["선정기준", firstText(detail.선정기준, listItem?.선정기준)],
    ["지원조건", describeGov24SupportConditions(supportConditions)],
  ]);
  const applicationUrl = optionalUrl(detail.온라인신청사이트URL);
  const sourceUrl = optionalUrl(listItem?.상세조회URL);
  const regionCodes = mapRegionCodes(
    detail.소관기관명,
    detail.접수기관명,
    listItem?.소관기관명,
    listItem?.접수기관,
  );

  return finalizeNormalizedPolicy({
    title: detail.서비스명,
    summary: firstText(detail.서비스목적, listItem?.서비스목적요약),
    supportContent: firstText(detail.지원내용, listItem?.지원내용),
    eligibility,
    applicationStartDate: dateRange.startDate,
    applicationEndDate: dateRange.endDate,
    applicationPeriodText,
    isRolling: dateRange.isRolling,
    applicationMethod: joinTextSections([
      ["신청방법", firstText(detail.신청방법, listItem?.신청방법)],
      ["구비서류", detail.구비서류],
    ]),
    applicationUrl,
    organizationName: firstText(detail.소관기관명, listItem?.소관기관명),
    contact: firstText(detail.문의처, listItem?.전화문의),
    category: mapCategory(
      listItem?.서비스분야,
      detail.서비스명,
      detail.서비스목적,
      detail.지원내용,
    ),
    regionCodes: regionCodes.length > 0 ? [...regionCodes] : ["00"],
    sources: ["gov24"],
    sourceRefs: {
      gov24: {
        externalId: detail.서비스ID,
        url: sourceUrl,
      },
    },
  });
}

function describeGov24SupportConditions(
  supportConditions: Gov24SupportConditions | undefined,
): string | undefined {
  if (!supportConditions) {
    return undefined;
  }

  const conditions = [
    supportConditions.JA0110 || supportConditions.JA0111
      ? `연령 ${supportConditions.JA0110 ?? "제한 없음"}~${
          supportConditions.JA0111 ?? "제한 없음"
        }세`
      : undefined,
    isSelectedCondition(supportConditions.JA0320)
      ? "대학생/대학원생"
      : undefined,
    isSelectedCondition(supportConditions.JA0326) ? "근로자/직장인" : undefined,
    isSelectedCondition(supportConditions.JA0327) ? "구직자/실업자" : undefined,
    isSelectedCondition(supportConditions.JA1101) ? "예비창업자" : undefined,
  ].filter((condition): condition is string => Boolean(condition));

  return conditions.length > 0 ? conditions.join(", ") : undefined;
}

function isSelectedCondition(value: string | undefined): boolean {
  return value?.trim().toUpperCase() === "Y";
}
