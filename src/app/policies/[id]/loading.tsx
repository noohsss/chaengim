export default function PolicyDetailLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-off-white)]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="space-y-4 border-b border-border px-6 py-10 sm:px-10">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-10 max-w-xl animate-pulse rounded bg-muted" />
            <div className="h-5 max-w-2xl animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6">
              <div className="h-36 animate-pulse rounded bg-muted" />
              <div className="h-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-52 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}
