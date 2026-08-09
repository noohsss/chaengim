import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PageBackButton } from "@/components/navigation/page-back-button";
import { createClient } from "@/lib/supabase/server";
import {
  listNotifications,
  type NotificationListItem,
} from "@/server/notifications/notification-repository";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "./actions";

export const metadata: Metadata = {
  title: "알림 | 챙김",
};

type NotificationsPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

const statusSchema = z.enum(["all_read", "failed", "invalid", "read"]);
const notificationTypeLabels: Readonly<Record<NotificationListItem["type"], string>> = {
  deadline_7_days: "마감 7일 전",
  deadline_1_day: "마감 1일 전",
  policy_changed: "정책 변경",
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function getStatusMessage(status: string | undefined):
  | Readonly<{ message: string; tone: "error" | "success" }>
  | undefined {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return undefined;

  if (parsed.data === "failed" || parsed.data === "invalid") {
    return {
      message:
        parsed.data === "invalid"
          ? "알림을 다시 선택해 주세요."
          : "알림 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.",
      tone: "error",
    };
  }

  return {
    message:
      parsed.data === "all_read"
        ? "모든 알림을 확인했어요."
        : "알림을 확인했어요.",
    tone: "success",
  };
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const client = await createClient();
  const { data: claims, error: claimsError } = await client.auth.getClaims();
  if (claimsError || !z.uuid().safeParse(claims?.claims.sub).success) {
    redirect("/login?next=%2Fnotifications");
  }

  const notifications = await listNotifications(client);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const params = await searchParams;
  const statusMessage = getStatusMessage(firstParam(params.status));

  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-3xl">
        <PageBackButton fallbackHref="/my" />
        <header className="flex items-center justify-between gap-4">
          <Link aria-label="챙김 홈" href="/">
            <BrandLogo size="compact" />
          </Link>
          <Link className="ui-secondary-action" href="/my">
            내 챙김
          </Link>
        </header>

        <section className="mt-10 rounded-[var(--radius)] bg-[var(--brand-sky)] p-6 sm:p-8">
          <p className="ui-eyebrow">알림함</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                놓치지 않도록 알려드릴게요
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                마감과 정책 변경 소식을 한곳에서 확인할 수 있어요.
              </p>
            </div>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <button className="ui-primary-action" type="submit">
                  모두 읽음 처리
                </button>
              </form>
            ) : null}
          </div>
        </section>

        {statusMessage ? (
          <p
            className={
              statusMessage.tone === "success"
                ? "ui-status-success mt-6 px-4 py-3 text-sm"
                : "ui-status-error mt-6 px-4 py-3 text-sm"
            }
            role={statusMessage.tone === "success" ? "status" : "alert"}
          >
            {statusMessage.message}
          </p>
        ) : null}

        {notifications.length === 0 ? (
          <section className="ui-card mt-8 border-dashed px-6 py-16 text-center shadow-none">
            <h2 className="font-semibold">아직 알림이 없어요</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              챙긴 정책의 마감과 변경 소식이 생기면 알려드릴게요.
            </p>
            <Link className="ui-primary-action mt-6" href="/#policies">
              정책 찾아보기
            </Link>
          </section>
        ) : (
          <ul className="mt-8 grid gap-4">
            {notifications.map((notification) => (
              <li
                className={`ui-card p-5 ${notification.read_at ? "" : "border-l-4 border-l-[var(--brand-cornflower)]"}`}
                key={notification.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {notificationTypeLabels[notification.type]}
                      {notification.read_at ? " · 확인함" : " · 새 알림"}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      {notification.title}
                    </h2>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={notification.created_at}
                  >
                    {formatDate(notification.created_at)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {notification.body}
                </p>
                {notification.reference_date ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    기준일 {formatDate(notification.reference_date)}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {notification.policy_id && notification.policies ? (
                    <Link
                      className="ui-secondary-action"
                      href={`/policies/${notification.policy_id}`}
                    >
                      정책 상세 보기
                    </Link>
                  ) : null}
                  {!notification.read_at ? (
                    <form action={markNotificationRead}>
                      <input
                        name="notificationId"
                        type="hidden"
                        value={notification.id}
                      />
                      <button className="ui-primary-action" type="submit">
                        읽음 처리
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
