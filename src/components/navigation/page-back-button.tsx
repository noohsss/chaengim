"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

type PageBackButtonProps = Readonly<{
  fallbackHref: string;
}>;

export function PageBackButton({ fallbackHref }: PageBackButtonProps): ReactElement {
  const router = useRouter();

  function handleClick(): void {
    const referrer = document.referrer;
    const hasSameOriginReferrer = referrer.startsWith(window.location.origin);

    if (hasSameOriginReferrer) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      aria-label="이전으로 돌아가기"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={handleClick}
      type="button"
    >
      <ArrowLeft aria-hidden="true" size={18} />
      이전으로 돌아가기
    </button>
  );
}
