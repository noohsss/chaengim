export default function MyLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-off-white)] px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="mt-10 h-10 w-80 max-w-full rounded bg-muted" />
        <div className="mt-3 h-5 w-96 max-w-full rounded bg-muted" />
        <div className="mt-8 h-28 rounded-2xl border border-border bg-card" />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border border-border bg-card" />
          <div className="h-72 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    </main>
  );
}
