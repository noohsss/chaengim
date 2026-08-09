import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { todayInSeoul } from "@/server/policies/policy-lifecycle";

import {
  getDeadlineNotificationType,
  makeNotificationEventKey,
} from "./notification-schedule";

const savedNotificationPolicySchema = z.object({
  user_id: z.uuid(),
  policy_id: z.uuid(),
  policies: z
    .object({
      id: z.uuid(),
      title: z.string().min(1),
      application_end_date: z.iso.date().nullable(),
      is_rolling: z.boolean(),
      version_hash: z.string().min(1),
    })
    .nullable(),
});

const savedNotificationPolicyColumns =
  "user_id,policy_id,policies(id,title,application_end_date,is_rolling,version_hash)";

type NotificationInsert = Readonly<{
  user_id: string;
  policy_id: string;
  type: "deadline_7_days" | "deadline_1_day" | "policy_changed";
  event_key: string;
  title: string;
  body: string;
  reference_date: string | null;
  email_status: "skipped";
}>;

export type NotificationGenerationResult = Readonly<{
  created: number;
  skipped: number;
}>;

async function listSavedNotificationPolicies(
  client: SupabaseClient,
): Promise<readonly z.infer<typeof savedNotificationPolicySchema>[]> {
  const { data, error } = await client
    .from("saved_policies")
    .select(savedNotificationPolicyColumns);
  if (error) throw new Error("알림 대상 정책을 불러오지 못했습니다");

  const parsed = z.array(savedNotificationPolicySchema).safeParse(data);
  if (!parsed.success) throw new Error("알림 대상 정책 형식이 올바르지 않습니다");
  return parsed.data.filter((item) => item.policies !== null);
}

async function insertNotifications(
  client: SupabaseClient,
  notifications: readonly NotificationInsert[],
): Promise<NotificationGenerationResult> {
  if (notifications.length === 0) return { created: 0, skipped: 0 };

  const { data, error } = await client
    .from("notifications")
    .upsert(notifications, {
      onConflict: "user_id,event_key",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) throw new Error("알림을 저장하지 못했습니다");

  const created = data?.length ?? 0;
  return { created, skipped: notifications.length - created };
}

export async function createDeadlineNotifications(
  client: SupabaseClient,
  today: string = todayInSeoul(),
): Promise<NotificationGenerationResult> {
  const savedPolicies = await listSavedNotificationPolicies(client);
  const notifications = savedPolicies.flatMap((savedPolicy) => {
    const policy = savedPolicy.policies;
    if (!policy) return [];
    const type = getDeadlineNotificationType(
      policy.application_end_date,
      policy.is_rolling,
      today,
    );
    if (!type || !policy.application_end_date) return [];
    const days = type === "deadline_7_days" ? 7 : 1;
    return [
      {
        user_id: savedPolicy.user_id,
        policy_id: savedPolicy.policy_id,
        type,
        event_key: makeNotificationEventKey(
          type,
          savedPolicy.policy_id,
          policy.application_end_date,
        ),
        title: `${policy.title} 마감이 ${days}일 남았어요`,
        body: "신청 조건과 공식 신청 페이지를 다시 확인해 보세요.",
        reference_date: policy.application_end_date,
        email_status: "skipped",
      } satisfies NotificationInsert,
    ];
  });

  return insertNotifications(client, notifications);
}

export async function createPolicyChangedNotifications(
  client: SupabaseClient,
  changedPolicyIds: readonly string[],
): Promise<NotificationGenerationResult> {
  const policyIds = [...new Set(changedPolicyIds)];
  if (policyIds.length === 0) return { created: 0, skipped: 0 };

  const savedPolicies = await listSavedNotificationPolicies(client);
  const changedIdSet = new Set(policyIds);
  const notifications = savedPolicies.flatMap((savedPolicy) => {
    const policy = savedPolicy.policies;
    if (!policy || !changedIdSet.has(savedPolicy.policy_id)) return [];
    return [
      {
        user_id: savedPolicy.user_id,
        policy_id: savedPolicy.policy_id,
        type: "policy_changed",
        event_key: makeNotificationEventKey(
          "policy_changed",
          savedPolicy.policy_id,
          policy.version_hash,
        ),
        title: `${policy.title} 정책 정보가 바뀌었어요`,
        body: "신청 기간과 조건, 공식 신청 페이지를 다시 확인해 보세요.",
        reference_date: null,
        email_status: "skipped",
      } satisfies NotificationInsert,
    ];
  });

  return insertNotifications(client, notifications);
}
