import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CircleDollarSign,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

type PolicySummaryCardProps = Readonly<{
  actionLabel?: string;
  applicationEndDate: string | null;
  applicationPeriodText: string | null;
  category: string;
  children?: ReactNode;
  href: string;
  isRolling: boolean;
  isSaved?: boolean;
  supportContent: string | null;
  title: string;
}>;

type MetaItemProps = Readonly<{
  icon: LucideIcon;
  label: string;
  value: string;
}>;

type DeadlineInfo = Readonly<{
  badge: string;
  date: string;
  tone: "neutral" | "success" | "urgent";
}>;

function compactText(value: string | null, fallback: string): string {
  if (!value) return fallback;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 24) return normalized;
  return `${normalized.slice(0, 23)}…`;
}

function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(new Date());
}

function formatDate(value: string): string {
  return value.replaceAll("-", ".");
}

function getDeadlineInfo(
  applicationEndDate: string | null,
  applicationPeriodText: string | null,
  isRolling: boolean,
): DeadlineInfo {
  if (isRolling) {
    return { badge: "상시 모집", date: "상시 모집", tone: "success" };
  }

  if (!applicationEndDate) {
    return {
      badge: "기간 확인",
      date: compactText(applicationPeriodText, "신청 기간 확인"),
      tone: "neutral",
    };
  }

  const endTime = Date.parse(`${applicationEndDate}T00:00:00+09:00`);
  const todayTime = Date.parse(`${todayInSeoul()}T00:00:00+09:00`);
  const daysRemaining = Math.ceil((endTime - todayTime) / 86_400_000);

  if (daysRemaining < 0) {
    return { badge: "마감됨", date: formatDate(applicationEndDate), tone: "neutral" };
  }

  if (daysRemaining === 0) {
    return { badge: "D-day", date: formatDate(applicationEndDate), tone: "success" };
  }

  if (daysRemaining <= 7) {
    return {
      badge: `마감 ${daysRemaining}일 전`,
      date: formatDate(applicationEndDate),
      tone: "urgent",
    };
  }

  return {
    badge: `D-${daysRemaining}`,
    date: formatDate(applicationEndDate),
    tone: "success",
  };
}

function PolicyMetaItem({ icon: Icon, label, value }: MetaItemProps): ReactElement {
  return (
    <div className="flex min-w-0 items-start gap-2 px-4 py-4 sm:min-h-20 sm:items-center sm:px-5">
      <Icon
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-primary sm:mt-0"
        size={18}
        strokeWidth={2}
      />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

export function PolicySummaryCard({
  actionLabel,
  applicationEndDate,
  applicationPeriodText,
  category,
  children,
  href,
  isRolling,
  isSaved = false,
  supportContent,
  title,
}: PolicySummaryCardProps): ReactElement {
  const resolvedActionLabel = actionLabel ?? (isSaved ? "챙기기 취소" : "챙기기");
  const categoryLabel = CATEGORY_LABELS[category] ?? "기타";
  const deadline = getDeadlineInfo(
    applicationEndDate,
    applicationPeriodText,
    isRolling,
  );
  const deadlineToneClass =
    deadline.tone === "urgent"
      ? "text-destructive"
      : deadline.tone === "success"
        ? "text-accent-foreground"
        : "text-muted-foreground";

  return (
    <article className="ui-card overflow-hidden transition-shadow hover:shadow-[0_1rem_3rem_rgba(37,42,51,0.1)]">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex min-h-7 items-center rounded-full bg-secondary px-3 text-xs font-semibold text-secondary-foreground">
              {categoryLabel}
            </span>
            <span
              aria-label={isSaved ? "챙긴 정책" : "아직 안 챙긴 정책"}
              className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-3 text-xs font-semibold ${
                isSaved
                  ? "border-[var(--brand-mint)] bg-[var(--brand-mint)] text-accent-foreground"
                  : "border-border bg-[var(--brand-light-gray)] text-muted-foreground"
              }`}
            >
              {isSaved ? "챙긴 정책" : "아직 안 챙긴 정책"}
            </span>
          </div>
          <h4 className="mt-3 line-clamp-2 text-[1.375rem] font-medium leading-7 tracking-[-0.025em]">
            <Link className="transition-colors hover:text-primary" href={href}>
              {title}
            </Link>
          </h4>
          <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${deadlineToneClass}`}>
            <CalendarDays aria-hidden="true" size={16} strokeWidth={2} />
            {deadline.badge}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-border px-5 py-4 sm:flex-col sm:border-l sm:border-t-0 sm:px-4 sm:py-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            {isSaved ? (
              <BookmarkCheck aria-hidden="true" size={24} strokeWidth={2} />
            ) : (
              <Bookmark aria-hidden="true" size={24} strokeWidth={2} />
            )}
          </span>
          <Link className="ui-secondary-action min-h-10 px-4" href={href}>
            {resolvedActionLabel}
          </Link>
        </div>
      </div>

      <div className="grid border-t border-border sm:grid-cols-3 [&>*+*]:border-t [&>*]:border-border sm:[&>*+*]:border-l sm:[&>*+*]:border-t-0">
        <PolicyMetaItem icon={Tag} label="분야" value={categoryLabel} />
        <PolicyMetaItem
          icon={CircleDollarSign}
          label="지원 내용"
          value={compactText(supportContent, "상세 내용 확인")}
        />
        <PolicyMetaItem icon={CalendarDays} label="마감일" value={deadline.date} />
      </div>

      {children ? <div className="border-t border-border p-5 sm:p-6">{children}</div> : null}
    </article>
  );
}
