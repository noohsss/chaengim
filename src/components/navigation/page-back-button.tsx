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
      className="ui-secondary-action min-h-10 shrink-0 bg-white/75 px-3 shadow-sm hover:bg-white sm:px-4"
      onClick={handleClick}
      type="button"
    >
      <ArrowLeft aria-hidden="true" size={18} />
      이전으로 돌아가기
    </button>
  );
}
