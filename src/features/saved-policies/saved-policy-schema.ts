import { z } from "zod";

export const SAVED_POLICY_STATUS_OPTIONS = [
  { label: "관심", value: "interested" },
  { label: "확인 중", value: "reviewing" },
  { label: "신청 예정", value: "planning_to_apply" },
  { label: "신청 완료", value: "applied" },
  { label: "결과 기록", value: "result_recorded" },
] as const;

export const SAVED_POLICY_PRIORITY_OPTIONS = [
  { label: "낮음", value: "low" },
  { label: "보통", value: "normal" },
  { label: "높음", value: "high" },
] as const;

export const savedPolicyStatusSchema = z.enum(
  SAVED_POLICY_STATUS_OPTIONS.map((option) => option.value),
);
export const savedPolicyPrioritySchema = z.enum(
  SAVED_POLICY_PRIORITY_OPTIONS.map((option) => option.value),
);

export type SavedPolicyStatus = z.infer<typeof savedPolicyStatusSchema>;
export type SavedPolicyPriority = z.infer<typeof savedPolicyPrioritySchema>;
