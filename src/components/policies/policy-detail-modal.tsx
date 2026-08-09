"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type PolicyDetailModalProps = Readonly<{
  children: ReactNode;
}>;

export function PolicyDetailModal({
  children,
}: PolicyDetailModalProps): ReactNode {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        router.back();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div
      aria-label="정책 상세"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 sm:p-6"
      onClick={() => router.back()}
      ref={modalRef}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="relative mx-auto max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="정책 상세 닫기"
          className="sticky right-3 top-3 z-10 ml-auto flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted sm:mr-3"
          onClick={() => router.back()}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
