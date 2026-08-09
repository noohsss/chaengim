import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const notificationTypeSchema = z.enum([
  "deadline_7_days",
  "deadline_1_day",
  "policy_changed",
]);

const notificationRowSchema = z.object({
  id: z.uuid(),
  policy_id: z.uuid().nullable(),
  type: notificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  reference_date: z.iso.date().nullable(),
  read_at: z.iso.datetime({ offset: true }).nullable(),
  created_at: z.iso.datetime({ offset: true }),
  policies: z
    .object({ id: z.uuid(), title: z.string().min(1) })
    .nullable(),
});

export type NotificationListItem = z.infer<typeof notificationRowSchema>;

const NOTIFICATION_COLUMNS =
  "id,policy_id,type,title,body,reference_date,read_at,created_at,policies(id,title)";

export async function listNotifications(
  client: SupabaseClient,
): Promise<readonly NotificationListItem[]> {
  const { data, error } = await client
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("알림을 불러오지 못했습니다");
  }

  const parsed = z.array(notificationRowSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("알림 데이터 형식이 올바르지 않습니다");
  }

  return parsed.data;
}

export async function countUnreadNotifications(
  client: SupabaseClient,
): Promise<number> {
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    throw new Error("읽지 않은 알림 수를 불러오지 못했습니다");
  }

  return count ?? 0;
}
