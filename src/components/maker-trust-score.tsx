import { SITE_NAME } from "@/lib/brand";

/** Public extension page — refined presentation for maker listing-count index (1–10). */
export function MakerTrustScoreCard({ score, listingCount }: { score: number; listingCount: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-5 shadow-sm ring-1 ring-zinc-950/[0.04] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Maker trust index</p>
          <p className="text-sm leading-relaxed text-zinc-600">
            Reflects how many listings this maker has on {SITE_NAME} (including pending and rejected). It is a
            directory activity signal, not a product quality rating.
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1 border-t border-zinc-100 pt-4 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-zinc-900">{score}</span>
          <span className="text-base font-medium text-zinc-400">/ 10</span>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
          <span>Scale</span>
          <span className="tabular-nums">
            <span className="font-medium text-zinc-700">{listingCount}</span> listing{listingCount === 1 ? "" : "s"} on file
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-zinc-600 via-teal-600 to-emerald-500"
            style={{ width: `${pct}%` }}
            role="presentation"
          />
        </div>
      </div>
    </div>
  );
}
