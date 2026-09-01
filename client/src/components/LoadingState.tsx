/**
 * Animated skeleton loading state — 6 placeholder rows with shimmer effect.
 * Shown while /api/patients is in-flight.
 */
export default function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading patients" role="status">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border border-slate-200 rounded-xl bg-white px-4 py-3 overflow-hidden"
        >
          <div className="flex items-center gap-4">
            {/* ID pill */}
            <div className="w-12 h-3 rounded bg-slate-200 animate-pulse" />

            {/* Name + reason */}
            <div className="flex-1 space-y-2">
              <div
                className="h-3.5 rounded bg-slate-200 animate-pulse"
                style={{ width: `${45 + (i % 4) * 10}%` }}
              />
              <div
                className="h-2.5 rounded bg-slate-100 animate-pulse"
                style={{ width: `${60 + (i % 3) * 8}%` }}
              />
            </div>

            {/* Stats */}
            <div className="hidden md:flex gap-4">
              <div className="w-10 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-12 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-16 h-3 rounded bg-slate-200 animate-pulse" />
            </div>

            {/* Badge + score */}
            <div className="w-16 h-5 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-12 h-3 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
