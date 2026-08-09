"use client";

import { BookmarkCheck, ChevronDown, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AccountMenu() {
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
        className="flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
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
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-44 rounded-xl border border-border bg-card p-1.5 shadow-[0_12px_36px_rgba(37,42,51,0.14)]"
          role="menu"
        >
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
        </div>
      ) : null}
    </div>
  );
}
