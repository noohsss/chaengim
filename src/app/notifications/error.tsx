"use client";

export default function NotificationsError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">알림을 불러오지 못했어요</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          className="ui-primary-action mt-6"
          onClick={reset}
          type="button"
        >
          다시 시도하기
        </button>
      </section>
    </main>
  );
}
