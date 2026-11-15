/**
 * Route-level skeleton for /jobs. Matches the real layout (search band,
 * filter rail, result rows) so the shift to loaded content is positional,
 * not a jump — the shimmer uses the shared `.mk-skeleton` utility.
 */
export default function JobsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading jobs">
      {/* Search band */}
      <div className="bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mk-skeleton h-9 w-56" />
          <div className="mk-skeleton mt-3 h-4 w-80 max-w-full" />
          <div className="mk-skeleton mt-6 h-14 w-full max-w-2xl rounded-xl" />
          <div className="mt-5 flex flex-wrap gap-2.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="mk-skeleton h-9 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filter rail */}
          <div className="hidden rounded-xl border border-slate-200 bg-white p-5 lg:block">
            <div className="mk-skeleton h-5 w-24" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index}>
                  <div className="mk-skeleton h-3.5 w-20" />
                  <div className="mk-skeleton mt-2 h-10 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="mk-skeleton h-16 w-full rounded-xl" />
            <div className="mk-skeleton mt-5 h-5 w-52" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mk-skeleton h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="mk-skeleton h-5 w-2/3" />
                    <div className="mk-skeleton mt-2 h-4 w-40" />
                    <div className="mt-4 flex gap-4">
                      <div className="mk-skeleton h-4 w-28" />
                      <div className="mk-skeleton h-4 w-24" />
                      <div className="mk-skeleton h-4 w-24" />
                    </div>
                    <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3">
                      <div className="mk-skeleton h-4 w-32" />
                      <div className="mk-skeleton h-4 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
