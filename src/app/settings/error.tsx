"use client";

import type { ReactElement } from "react";

type SettingsErrorProps = Readonly<{
  reset: () => void;
}>;

export default function SettingsError({
  reset,
}: SettingsErrorProps): ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <h1 className="text-[1.375rem] font-medium leading-7">
          내 정보를 불러오지 못했어요
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          className="mt-6 min-h-11 rounded-[var(--radius-control)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          onClick={reset}
          type="button"
        >
          다시 시도하기
        </button>
      </section>
    </main>
  );
}
