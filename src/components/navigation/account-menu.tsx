"use client";

import { Bell, BookmarkCheck, ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/settings/actions";

type AccountMenuProps = Readonly<{
  unreadNotificationCount?: number;
}>;

export function AccountMenu({ unreadNotificationCount = 0 }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="ui-primary-action px-4"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        내 메뉴
        <ChevronDown
          aria-hidden="true"
          className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
          size={16}
        />
      </button>

      {isOpen ? (
        <div
          aria-label="내 메뉴"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-44 rounded-[var(--radius)] border border-border bg-card p-1.5 shadow-[0_12px_36px_rgba(37,42,51,0.12)]"
          role="menu"
        >
          <Link
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            href="/notifications"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <span className="inline-flex items-center gap-2">
              <Bell aria-hidden="true" size={17} />
              알림함
            </span>
            {unreadNotificationCount > 0 ? (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>
          <Link
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            href="/my"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <BookmarkCheck aria-hidden="true" size={17} />
            내 챙김
          </Link>
          <Link
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            href="/settings"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <UserRound aria-hidden="true" size={17} />
            내 정보
          </Link>
          <div className="my-1 border-t border-border" />
          <form action={signOut}>
            <button
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              role="menuitem"
              type="submit"
            >
              <LogOut aria-hidden="true" size={17} />
              로그아웃
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
