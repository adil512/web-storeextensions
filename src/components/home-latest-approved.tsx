import Link from "next/link";
import { extensionListingHref } from "@/lib/listing-slug";

export type LatestApprovedRow = {
  id: string;
  slug?: string | null;
  name: string;
  category: string;
  current_users: number;
  languages: string[];
  featured_order: number | null;
};

const PAGE_SIZE = 100;

type Props = {
  listings: LatestApprovedRow[];
  totalCount: number;
  currentPage: number;
};

function pageHref(p: number) {
  if (p <= 1) return "/#browse";
  return `/?page=${p}#browse`;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function HomeLatestApproved({ listings, totalCount, currentPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showPagination = totalPages > 1;
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <section className="border-t border-zinc-200/80 bg-gradient-to-b from-zinc-100/40 to-zinc-50/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Directory</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Latest Approved Extensions</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Recently reviewed listings ready to explore. Each row opens the full profile with metrics and install links.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
              {totalCount === 0 ? (
                "No listings yet"
              ) : (
                <>
                  <span className="tabular-nums text-zinc-900">{from.toLocaleString("en-US")}</span>
                  <span className="mx-1.5 text-zinc-400">–</span>
                  <span className="tabular-nums text-zinc-900">{to.toLocaleString("en-US")}</span>
                  <span className="ml-2 text-zinc-500">of</span>
                  <span className="ml-1 font-semibold tabular-nums text-zinc-900">
                    {totalCount.toLocaleString("en-US")}
                  </span>
                </>
              )}
            </span>
            {totalCount > 0 ? (
              <span className="text-xs text-zinc-500">Sorted by featured, then newest</span>
            ) : null}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300/90 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
            <p className="text-base font-medium text-zinc-800">No approved extensions yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              Be the first to submit—listings appear here after moderator approval.
            </p>
            <Link
              href="/submit"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
            >
              Submit an extension
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop & tablet: directory table */}
            <div className="mt-10 hidden overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_12px_40px_-24px_rgba(0,0,0,0.12)] md:block">
              <div className="grid grid-cols-[minmax(0,10rem)_5rem_minmax(0,1fr)_6rem_4.5rem] gap-4 border-b border-zinc-200 bg-zinc-50/95 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 lg:grid-cols-[minmax(0,11rem)_5.5rem_minmax(0,1fr)_6.5rem_4.5rem] lg:px-6">
                <div>Category</div>
                <div className="text-center">Spotlight</div>
                <div>Extension</div>
                <div className="text-right">Users</div>
                <div className="text-right">Lang</div>
              </div>
              <div className="divide-y divide-zinc-100">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={extensionListingHref({ id: listing.id, slug: listing.slug })}
                    className="group grid grid-cols-[minmax(0,10rem)_5rem_minmax(0,1fr)_6rem_4.5rem] gap-4 px-5 py-4 transition-colors duration-150 hover:bg-orange-50/25 lg:grid-cols-[minmax(0,11rem)_5.5rem_minmax(0,1fr)_6.5rem_4.5rem] lg:px-6 lg:py-3.5"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex max-w-full items-center truncate rounded-lg bg-zinc-100/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200/70 transition group-hover:bg-white group-hover:text-orange-800 group-hover:ring-orange-200/80">
                        {listing.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      {listing.featured_order != null ? (
                        <span className="inline-flex rounded-full bg-gradient-to-b from-orange-100 to-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-900 ring-1 ring-orange-200/90 shadow-sm">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-300">—</span>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate text-[15px] font-semibold leading-snug text-zinc-900 transition group-hover:text-orange-700">
                        {listing.name}
                      </span>
                      <ChevronIcon className="hidden h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500 sm:block" />
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-sm font-semibold tabular-nums text-zinc-800">
                        {listing.current_users.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="inline-flex min-w-[1.75rem] justify-end text-sm font-medium tabular-nums text-zinc-600">
                        {(listing.languages ?? []).length}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile: stacked cards */}
            <ul className="mt-8 space-y-3 md:hidden">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={extensionListingHref({ id: listing.id, slug: listing.slug })}
                    className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:border-orange-200/80 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full truncate rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                        {listing.category}
                      </span>
                      {listing.featured_order != null ? (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-900 ring-1 ring-orange-200/80">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-base font-semibold leading-snug text-zinc-900 group-hover:text-orange-700">
                        {listing.name}
                      </p>
                      <ChevronIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300 group-hover:text-orange-500" />
                    </div>
                    <div className="flex gap-6 border-t border-zinc-100 pt-3 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Users</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-zinc-800">
                          {listing.current_users.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Languages</p>
                        <p className="mt-0.5 font-medium tabular-nums text-zinc-600">{(listing.languages ?? []).length}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {showPagination ? (
          <nav
            className="mt-8 flex flex-col items-stretch gap-4 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
            aria-label="Latest extensions pagination"
          >
            <p className="text-center text-sm text-zinc-600 sm:text-left">
              Page <span className="font-semibold text-zinc-900">{currentPage}</span>
              <span className="text-zinc-400"> / </span>
              <span className="font-semibold text-zinc-900">{totalPages}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={pageHref(currentPage - 1)}
                className={`inline-flex min-h-[2.5rem] items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                  currentPage <= 1
                    ? "cursor-not-allowed border border-zinc-100 bg-zinc-50 text-zinc-300"
                    : "border border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-900"
                }`}
                aria-disabled={currentPage <= 1}
              >
                Previous
              </Link>
              <div className="hidden items-center gap-0.5 sm:flex">
                {(() => {
                  const set = new Set<number>();
                  for (let p = 1; p <= Math.min(2, totalPages); p++) set.add(p);
                  for (let p = Math.max(1, totalPages - 1); p <= totalPages; p++) set.add(p);
                  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
                    if (p >= 1 && p <= totalPages) set.add(p);
                  }
                  const nums = [...set].sort((a, b) => a - b);
                  return nums.map((p, idx) => {
                    const prev = nums[idx - 1];
                    const showEllipsis = prev != null && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis ? <span className="px-2 text-zinc-400">…</span> : null}
                        <Link
                          href={pageHref(p)}
                          className={`flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-xl text-sm font-semibold transition ${
                            p === currentPage
                              ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                              : "text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {p}
                        </Link>
                      </span>
                    );
                  });
                })()}
              </div>
              <Link
                href={pageHref(currentPage + 1)}
                className={`inline-flex min-h-[2.5rem] items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                  currentPage >= totalPages
                    ? "cursor-not-allowed border border-zinc-100 bg-zinc-50 text-zinc-300"
                    : "border border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-900"
                }`}
                aria-disabled={currentPage >= totalPages}
              >
                Next
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

export { PAGE_SIZE };
