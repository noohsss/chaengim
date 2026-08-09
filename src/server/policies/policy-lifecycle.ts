import { z } from "zod";

import type { NormalizedPolicy } from "./normalized-policy";

export const policyLifecycleStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export type PolicyLifecycleStatus = z.infer<
  typeof policyLifecycleStatusSchema
>;

export function todayInSeoul(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("한국 시간 기준 날짜를 계산할 수 없습니다");
  }

  return `${year}-${month}-${day}`;
}

export function getPolicyLifecycleStatus(
  policy: Pick<NormalizedPolicy, "applicationEndDate" | "isRolling">,
  today: string = todayInSeoul(),
): PolicyLifecycleStatus {
  if (
    policy.isRolling ||
    !policy.applicationEndDate ||
    policy.applicationEndDate >= today
  ) {
    return "active";
  }

  return "archived";
}
