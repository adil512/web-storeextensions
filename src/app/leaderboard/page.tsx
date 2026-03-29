import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Extension Creators – Leaderboard by Upvotes & Listings",
  description:
    "Explore the extension leaderboard featuring top developers ranked by upvotes and published listings. Discover the most popular Chrome, Firefox, and Edge extensions and the creators behind them.",
  alternates: { canonical: canonicalUrl("/leaderboard") },
};

type LeaderRow = {
  profile_id: string;
  username: string | null;
  full_name: string | null;
  listing_count: number;
  total_upvotes: number;
};

function displayName(row: LeaderRow) {
  if (row.full_name?.trim()) return row.full_name.trim();
  if (row.username) return `@${row.username}`;
  return "Member";
}

function initials(row: LeaderRow) {
  const base = row.full_name?.trim() || row.username || "?";
  const parts = base.replace(/^@/, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("leaderboard_makers", { p_limit: 100 });

  const rows: LeaderRow[] =
    !error && data
      ? (data as Record<string, unknown>[]).map((r) => ({
          profile_id: String(r.profile_id),
          username: r.username != null ? String(r.username) : null,
          full_name: r.full_name != null ? String(r.full_name) : null,
          listing_count: Number(r.listing_count ?? 0),
          total_upvotes: Number(r.total_upvotes ?? 0),
        }))
      : [];

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" aria-hidden />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Leaderboard</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Ranked by upvotes on approved listings, then by listing count. Profiles without listings appear with zero
            scores.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        {error ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-600 shadow-sm">
            Leaderboard is unavailable until the database function is installed.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-500">No profiles to display.</p>
            <Link href="/auth" className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_16px_48px_-28px_rgba(0,0,0,0.12)]">
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Top 100 makers</p>
            </div>
            <ul className="divide-y divide-zinc-100">
              {rows.map((row, i) => {
                const rank = i + 1;
                const top = rank <= 3;
                return (
                  <li key={row.profile_id}>
                    <div className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-zinc-50/80 sm:gap-4 sm:px-6 sm:py-4">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:h-10 sm:w-10 sm:text-sm ${
                          rank === 1
                            ? "bg-amber-100 text-amber-900"
                            : rank === 2
                              ? "bg-zinc-200 text-zinc-800"
                              : rank === 3
                                ? "bg-orange-100 text-orange-900"
                                : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {rank}
                      </div>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-zinc-600 sm:h-11 sm:w-11 sm:text-sm ${
                          top ? "bg-gradient-to-br from-orange-100 to-amber-50 ring-2 ring-orange-200/60" : "bg-zinc-100"
                        }`}
                      >
                        {initials(row)}
                      </div>
                      <div className="min-w-0 flex-1">
                        {row.username ? (
                          <Link
                            href={`/u/${row.username}`}
                            className="truncate text-sm font-semibold text-zinc-900 hover:text-orange-600 sm:text-base"
                          >
                            {displayName(row)}
                          </Link>
                        ) : (
                          <span className="truncate text-sm font-semibold text-zinc-900 sm:text-base">{displayName(row)}</span>
                        )}
                        {row.username ? (
                          <p className="truncate text-xs text-zinc-500">@{row.username}</p>
                        ) : (
                          <p className="truncate text-xs text-zinc-400">No public username</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-4 text-right sm:gap-8">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Upvotes</p>
                          <p className="text-sm font-semibold tabular-nums text-zinc-900 sm:text-base">
                            {row.total_upvotes.toLocaleString("en-US")}
                          </p>
                        </div>
                        <div className="w-[4.5rem] sm:w-20">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Listings</p>
                          <p className="text-sm font-semibold tabular-nums text-zinc-900 sm:text-base">
                            {row.listing_count.toLocaleString("en-US")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
