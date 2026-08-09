import { z } from "zod";

export const notificationDeadlineTypeSchema = z.enum([
  "deadline_7_days",
  "deadline_1_day",
]);

export type NotificationDeadlineType = z.infer<
  typeof notificationDeadlineTypeSchema
>;

export function daysUntilDeadline(
  deadline: string,
  today: string,
): number | undefined {
  const deadlineMs = Date.parse(`${deadline}T00:00:00Z`);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(todayMs)) {
    return undefined;
  }

  return Math.round((deadlineMs - todayMs) / (24 * 60 * 60 * 1000));
}

export function getDeadlineNotificationType(
  deadline: string | null,
  isRolling: boolean,
  today: string,
): NotificationDeadlineType | undefined {
  if (!deadline || isRolling) return undefined;
  const days = daysUntilDeadline(deadline, today);
  if (days === 7) return "deadline_7_days";
  if (days === 1) return "deadline_1_day";
  return undefined;
}

export function makeNotificationEventKey(
  type: string,
  policyId: string,
  reference: string,
): string {
  return `${type}:${policyId}:${reference}`;
}
