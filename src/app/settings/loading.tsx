export default function SettingsLoading() {
  return (
    <main className="min-h-screen px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl animate-pulse">
        <div className="h-8 w-28 rounded bg-muted" />
        <div className="mt-10 h-7 w-24 rounded bg-muted" />
        <div className="mt-2 h-5 w-72 max-w-full rounded bg-muted" />
        <div className="mt-6 h-64 rounded-xl border bg-card" />
        <div className="mt-6 h-40 rounded-xl border bg-card" />
      </div>
    </main>
  );
}
