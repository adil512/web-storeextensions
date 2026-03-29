import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ExtensionCommentsSection, type PublicListingComment } from "@/components/extension-comments-section";
import { ReportListingButton, ExtensionViewTracker, TrackedStoreLink } from "@/components/extension-public-actions";
import { ListingUpvote } from "@/components/listing-upvote";
import { MakerTrustScoreCard } from "@/components/maker-trust-score";
import { SITE_NAME } from "@/lib/brand";
import { categoryHref } from "@/lib/category-slugs";
import { STORE_PLATFORM_LABELS, parseStorePlatform } from "@/lib/constants/listing";
import { extensionListingHref, extensionPublicHref, isListingUuidParam } from "@/lib/listing-slug";
import { canonicalUrl } from "@/lib/site-url";
import { trustScoreFromListingCount } from "@/lib/trust-score";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

/** Row shape for this page’s listing query (slug optional until migration backfill). */
type ExtensionListingPageRow = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  category: string;
  owner_id: string | null;
  is_platform_curated?: boolean | null;
  extension_id?: string | null;
  store_url?: string | null;
  current_users: number;
  uninstalls_last_30_days: number;
  languages: string[];
  view_count?: number | null;
  store_click_count?: number | null;
  profiles: unknown;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params;
  const segment = raw.trim();
  const supabase = await createSupabaseServerClient();

  let row: { id: string; name: string; slug?: string | null } | null = null;
  if (isListingUuidParam(segment)) {
    const { data } = await supabase
      .from("extension_listings")
      .select("id,name,slug")
      .eq("id", segment)
      .eq("status", "approved")
      .maybeSingle();
    row = data;
  } else {
    const { data } = await supabase
      .from("extension_listings")
      .select("id,name,slug")
      .eq("slug", segment.toLowerCase())
      .eq("status", "approved")
      .maybeSingle();
    row = data;
  }

  if (!row) return { title: "Extension" };

  return {
    title: `${row.name} · ${SITE_NAME}`,
    description: `View ${row.name} in our moderated browser extension directory.`,
    alternates: { canonical: canonicalUrl(extensionListingHref(row)) },
  };
}

export default async function ExtensionDetailPage({ params }: Props) {
  const { slug: raw } = await params;
  const segment = raw.trim();
  const supabase = await createSupabaseServerClient();

  const listingSelect = "*, profiles!extension_listings_owner_id_fkey(username,full_name)";
  let listing: ExtensionListingPageRow | null = null;

  if (isListingUuidParam(segment)) {
    const { data } = await supabase
      .from("extension_listings")
      .select(listingSelect)
      .eq("id", segment)
      .eq("status", "approved")
      .maybeSingle();
    listing = data as ExtensionListingPageRow | null;
    const slug = listing && typeof listing.slug === "string" ? listing.slug.trim() : "";
    if (slug) {
      permanentRedirect(extensionPublicHref(slug));
    }
  } else {
    const { data } = await supabase
      .from("extension_listings")
      .select(listingSelect)
      .eq("slug", segment.toLowerCase())
      .eq("status", "approved")
      .maybeSingle();
    listing = data as ExtensionListingPageRow | null;
    const canonical = listing && typeof listing.slug === "string" ? listing.slug : "";
    if (canonical && segment !== canonical) {
      permanentRedirect(extensionPublicHref(canonical));
    }
  }

  if (!listing) notFound();

  const id = listing.id as string;

  const { data: commentRows, error: commentsErr } = await supabase
    .from("listing_comments")
    .select("id,body,created_at,profiles(username)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  const comments: PublicListingComment[] =
    !commentsErr && commentRows
      ? commentRows.map((row: { id: string; body: string; created_at: string; profiles: unknown }) => {
          const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const username =
            p && typeof p === "object" && "username" in p ? (p as { username: string | null }).username : null;
          return { id: row.id, body: row.body, created_at: row.created_at, username };
        })
      : [];

  const owner = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
  const isCurated = listing.owner_id == null || listing.is_platform_curated === true;
  const attribution = isCurated
    ? `${SITE_NAME} curated pick`
    : owner?.full_name || owner?.username
      ? `By @${owner?.username || "maker"}`
      : "Community listing";

  let makerListingCount = 0;
  let trustScore = 0;
  if (!isCurated && listing.owner_id) {
    const { data: countVal, error: rpcErr } = await supabase.rpc("count_listings_by_owner_for_trust", {
      p_owner: listing.owner_id,
    });
    const n = typeof countVal === "number" ? countVal : Number(countVal);
    if (!rpcErr && Number.isFinite(n)) {
      makerListingCount = n;
      trustScore = trustScoreFromListingCount(n);
    } else {
      const { count } = await supabase
        .from("extension_listings")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", listing.owner_id)
        .eq("status", "approved");
      makerListingCount = count ?? 0;
      trustScore = trustScoreFromListingCount(makerListingCount);
    }
  }

  const views = listing.view_count ?? 0;
  const clicks = listing.store_click_count ?? 0;
  const extId = listing.extension_id as string | undefined;
  const upvotes = (listing as { upvote_count?: number }).upvote_count ?? 0;
  const storePlatform = parseStorePlatform(
    (listing as { store_platform?: string | null }).store_platform,
  );
  const platformLabel = STORE_PLATFORM_LABELS[storePlatform];

  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-zinc-100/60 to-zinc-50">
      <ExtensionViewTracker listingId={id} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/#browse" className="text-sm font-medium text-orange-600 hover:text-orange-700">
          ← Back to listings
        </Link>

        <article className="mt-6 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_20px_50px_-40px_rgba(0,0,0,0.18)]">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-orange-500/10 via-amber-400/10 to-orange-500/10 px-6 py-5 sm:px-8">
            <Link
              href={categoryHref(listing.category)}
              className="inline-flex text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-700/90 underline-offset-4 hover:text-orange-800 hover:underline"
            >
              {listing.category}
            </Link>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{listing.name}</h1>
            <p className="mt-2 text-sm text-zinc-600">{attribution}</p>

            <div className="mt-4">
              {isCurated ? (
                <div className="inline-flex flex-col gap-1 rounded-2xl border-2 border-violet-300 bg-violet-50 px-4 py-3 shadow-sm sm:inline-flex sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-violet-800">Directory curated</span>
                  <span className="text-sm font-semibold text-violet-950">Editorial pick — trust handled by our review team</span>
                </div>
              ) : listing.owner_id ? (
                <MakerTrustScoreCard score={trustScore} listingCount={makerListingCount} />
              ) : null}
            </div>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <p className="text-base leading-relaxed text-zinc-700">{listing.description}</p>

            <div className="grid gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Category</p>
                <p className="mt-1">
                  <Link
                    href={categoryHref(listing.category)}
                    className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {listing.category}
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Platform</p>
                <p className="mt-1 font-semibold text-zinc-800">{platformLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Extension ID</p>
                <p className="mt-1 break-all font-mono text-xs text-zinc-800">{extId || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Listing analytics</p>
                <p className="mt-1 text-zinc-700">
                  <span className="font-semibold tabular-nums">{views.toLocaleString("en-US")}</span> page views ·{" "}
                  <span className="font-semibold tabular-nums">{clicks.toLocaleString("en-US")}</span> store clicks
                </p>
              </div>
            </div>

            <ListingUpvote listingId={id} initialCount={upvotes} />

            {listing.store_url ? (
              <TrackedStoreLink
                listingId={id}
                href={listing.store_url}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-4 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 sm:inline-flex sm:w-auto"
              >
                Install on Chrome Web Store
              </TrackedStoreLink>
            ) : null}

            <div className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active users</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                  {listing.current_users.toLocaleString("en-US")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Uninstalls (30d)</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                  {listing.uninstalls_last_30_days.toLocaleString("en-US")}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Languages</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{listing.languages.join(", ")}</p>
              </div>
            </div>

            <ExtensionCommentsSection listingId={id} comments={comments} />

            <ReportListingButton listingId={id} />
          </div>
        </article>
      </div>
    </div>
  );
}
