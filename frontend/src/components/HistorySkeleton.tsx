export default function HistorySkeleton() {
  return (
    <div className="space-y-2 px-2 py-2" aria-hidden>
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-lg bg-slate-800/60 px-3 py-4">
          <div className="h-3 w-3/4 rounded bg-slate-700" />
          <div className="mt-2 h-2 w-1/2 rounded bg-slate-700/80" />
          <div className="mt-2 h-2 w-1/3 rounded bg-slate-700/60" />
        </div>
      ))}
    </div>
  );
}
