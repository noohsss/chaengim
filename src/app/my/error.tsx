"use client";

export default function MyError({
  reset,
}: Readonly<{
  reset: () => void;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--brand-off-white)] px-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">내 챙김을 불러오지 못했어요</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          className="mt-6 min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          onClick={reset}
          type="button"
        >
          다시 시도하기
        </button>
      </section>
    </main>
  );
}
