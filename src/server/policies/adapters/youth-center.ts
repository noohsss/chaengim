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

export const youthCenterPolicySchema = z
  .object({
    plcyNo: z.string().trim().min(1),
    plcyNm: z.string().trim().min(1),
    plcyExplnCn: z.string().optional(),
    plcySprtCn: z.string().optional(),
    plcyAplyMthdCn: z.string().optional(),
    aplyYmd: z.string().optional(),
    sprtTrgtCn: z.string().optional(),
    sprtSclLmtYn: z.string().optional(),
    earnCndCn: z.string().optional(),
    ageInfo: z.string().optional(),
    zipCd: z.string().optional(),
    mrgSttsCd: z.string().optional(),
    plcyMajorCd: z.string().optional(),
    jobCd: z.string().optional(),
    schoolCd: z.string().optional(),
    sbizCd: z.string().optional(),
    addAplyQlfcCndCn: z.string().optional(),
    ptcpPrpTrgtCn: z.string().optional(),
    inqCnt: z.string().optional(),
    sprvsnInstCdNm: z.string().optional(),
    operInstCdNm: z.string().optional(),
    aplyUrlAddr: z.string().optional(),
    refUrlAddr1: z.string().optional(),
    refUrlAddr2: z.string().optional(),
    plcyKywdNm: z.string().optional(),
    lclsfNm: z.string().optional(),
    mclsfNm: z.string().optional(),
  })
  .passthrough();

export type YouthCenterPolicy = z.infer<typeof youthCenterPolicySchema>;

export function normalizeYouthCenterPolicy(input: unknown): NormalizedPolicy {
  const policy = youthCenterPolicySchema.parse(input);
  const applicationPeriodText = firstText(policy.aplyYmd);
  const dateRange = parseDateRange(applicationPeriodText);
  const applicationUrl = optionalUrl(
    firstText(policy.aplyUrlAddr, policy.refUrlAddr1, policy.refUrlAddr2),
  );
  const sourceUrl = optionalUrl(firstText(policy.refUrlAddr1, policy.refUrlAddr2));
  const regionCodes = mapRegionCodes(
    policy.zipCd,
    policy.sprvsnInstCdNm,
    policy.operInstCdNm,
    policy.plcyExplnCn,
  );

  return finalizeNormalizedPolicy({
    title: policy.plcyNm,
    summary: policy.plcyExplnCn,
    supportContent: policy.plcySprtCn,
    eligibility: joinTextSections([
      ["지원대상", policy.sprtTrgtCn],
      ["연령", policy.ageInfo],
      ["소득", policy.earnCndCn],
      ["전공", policy.plcyMajorCd],
      ["취업상태", policy.jobCd],
      ["학력", policy.schoolCd],
      ["특화분야", policy.sbizCd],
      ["추가 신청 자격", policy.addAplyQlfcCndCn],
      ["참여 제한", policy.ptcpPrpTrgtCn],
    ]),
    applicationStartDate: dateRange.startDate,
    applicationEndDate: dateRange.endDate,
    applicationPeriodText,
    isRolling: dateRange.isRolling,
    applicationMethod: policy.plcyAplyMthdCn,
    applicationUrl,
    organizationName: firstText(policy.sprvsnInstCdNm, policy.operInstCdNm),
    contact: firstText(policy.inqCnt),
    category: mapCategory(
      policy.lclsfNm,
      policy.mclsfNm,
      policy.plcyKywdNm,
      policy.plcyNm,
      policy.plcyExplnCn,
    ),
    regionCodes: regionCodes.length > 0 ? [...regionCodes] : ["00"],
    sources: ["youth_center"],
    sourceRefs: {
      youth_center: {
        externalId: policy.plcyNo,
        url: sourceUrl,
      },
    },
  });
}
