export default function NotificationsLoading() {
  return (
    <main className="ui-page px-6 py-8 sm:py-12">
      <div className="ui-shell max-w-3xl">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-10 h-48 animate-pulse rounded-[var(--radius)] bg-muted" />
        <div className="mt-8 grid gap-4">
          <div className="h-36 animate-pulse rounded-[var(--radius)] bg-muted" />
          <div className="h-36 animate-pulse rounded-[var(--radius)] bg-muted" />
        </div>
      </div>
    </main>
  );
}
