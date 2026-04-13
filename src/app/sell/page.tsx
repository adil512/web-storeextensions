import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VerificationBadgeRow } from "@/components/marketplace/verification-badge-row";
import { SellHero } from "@/components/sell/sell-hero";
import { ListingUpvote } from "@/components/listing-upvote";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELL_CANONICAL = "https://webstoreextensions.com/sell";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Buy & Sell Chrome Extensions Marketplace | Browser Extensions for Sale";
  const description =
    "Buy and sell Chrome extensions in a verified marketplace. Explore Chrome, Firefox, Edge, and Brave browser extensions for sale or list your extension with transparent details and secure transactions.";
  return {
    title,
    description,
    alternates: {
      canonical: SELL_CANONICAL,
      languages: { "x-default": SELL_CANONICAL },
    },
    openGraph: {
      title,
      description,
      url: SELL_CANONICAL,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  logo_url: string | null;
  upvote_count: number | null;
  current_users: number | null;
  listing_country: string | null;
  store_url: string | null;
  price_usd: number | string | null;
  status: string;
  owner_id: string | null;
  profiles:
    | { username: string | null; full_name: string | null }
    | { username: string | null; full_name: string | null }[]
    | null;
};

function makerProfileBits(row: Row) {
  const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const username = p?.username?.trim() || null;
  const label = (p?.full_name?.trim() || username || "Maker").slice(0, 48);
  return { username, label };
}

const formatUsers = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

const formatPriceUsd = (price: number | string | null | undefined) => {
  const n = typeof price === "number" ? price : Number(price ?? NaN);
  if (!Number.isFinite(n) || n <= 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
};

export default async function SellPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("extension_listings")
    .select(
      "id, slug, name, description, category, logo_url, upvote_count, current_users, listing_country, store_url, price_usd, status, owner_id, profiles!extension_listings_owner_id_fkey(username, full_name)"
    )
    .eq("status", "approved")
    .eq("listed_for_sale", true)
    .order("updated_at", { ascending: false });

  const listings = (rows ?? []) as Row[];
  const listingIds = listings.map((l) => l.id);
  const badgeByListing = new Map<string, string[]>();
  if (listingIds.length > 0) {
    const { data: badgeRows } = await supabase
      .from("listing_verification_badges")
      .select("listing_id, badge_key")
      .in("listing_id", listingIds);
    for (const br of badgeRows ?? []) {
      const lid = String((br as { listing_id: string }).listing_id);
      const bk = String((br as { badge_key: string }).badge_key);
      const arr = badgeByListing.get(lid) ?? [];
      arr.push(bk);
      badgeByListing.set(lid, arr);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SellHero />

      <div id="marketplace-grid" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Live listings</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
              Verified Chrome extensions listed for sale explore active deals from real sellers.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-900/25 transition hover:from-orange-600 hover:to-orange-700"
          >
            Manage from dashboard
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-zinc-800">No extensions are listed for sale yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              When makers opt in from their approved listing in the dashboard, cards appear here automatically — Launchpad and categories stay unchanged.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:border-orange-200"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((ext) => {
              const labelCat = ext.category;
              const maker = makerProfileBits(ext);
              const badgeKeys = badgeByListing.get(ext.id) ?? [];
              return (
                <li
                  key={ext.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-orange-200/80 hover:shadow-lg hover:shadow-orange-600/10"
                >
                  <Link href={`/extensions/${ext.slug}`} className="block p-5 pb-4">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 shadow-inner">
                        {ext.logo_url ? (
                          <Image src={ext.logo_url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl font-black text-zinc-300">
                            {ext.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/90">{labelCat}</p>
                        <h3 className="mt-1 truncate text-lg font-bold text-zinc-900 group-hover:text-orange-700">
                          {ext.name}
                        </h3>
                        {ext.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{ext.description}</p>
                        ) : null}
                        {badgeKeys.length > 0 ? (
                          <div className="mt-2">
                            <VerificationBadgeRow badgeKeys={badgeKeys} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-3 gap-px border-y border-zinc-100 bg-zinc-100">
                    <div className="bg-zinc-50/90 px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Installs</p>
                      <p className="mt-0.5 text-sm font-bold text-zinc-900">{formatUsers(ext.current_users)}</p>
                    </div>
                    <div className="bg-white px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Upvotes</p>
                      <p className="mt-0.5 text-sm font-bold text-zinc-900">{ext.upvote_count ?? 0}</p>
                    </div>
                    <div className="bg-zinc-50/90 px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Primary geo</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-zinc-900">
                        {ext.listing_country?.trim() ? ext.listing_country : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="px-4 pt-3 text-xs font-medium text-zinc-600">Price: {formatPriceUsd(ext.price_usd)}</p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 p-4 pt-3">
                    <ListingUpvote listingId={ext.id} initialCount={ext.upvote_count ?? 0} compact />
                    {maker.username ? (
                      <Link
                        href={`/u/${maker.username}`}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        Contact maker
                      </Link>
                    ) : ext.owner_id ? (
                      <Link
                        href={`/extensions/${ext.slug}#listing-comments`}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 transition hover:border-orange-200 hover:text-orange-800"
                      >
                        Message on listing
                      </Link>
                    ) : (
                      <Link
                        href="/contact"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 transition hover:border-orange-200"
                      >
                        Contact site
                      </Link>
                    )}
                    <Link
                      href={`/extensions/${ext.slug}#listing-inquiry`}
                      className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-900 transition hover:border-orange-300"
                    >
                      Inquire
                    </Link>
                    <Link
                      href={`/extensions/${ext.slug}`}
                      className="ml-auto rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 transition hover:border-orange-200 hover:text-orange-800"
                    >
                      View story
                    </Link>
                    {ext.store_url ? (
                      <a
                        href={ext.store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-orange-600 hover:to-orange-700"
                      >
                        Install / store
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
