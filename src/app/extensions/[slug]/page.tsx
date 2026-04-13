import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExtensionCommentsSection, type PublicListingComment } from "@/components/extension-comments-section";
import { ReportListingButton, ExtensionViewTracker, TrackedStoreLink } from "@/components/extension-public-actions";
import { ListingInquiryForm } from "@/components/marketplace/listing-inquiry-form";
import { VerificationBadgeRow } from "@/components/marketplace/verification-badge-row";
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

function installButtonLabel(platform: ReturnType<typeof parseStorePlatform>) {
  if (platform === "mozilla") return "Install on Firefox Add-ons";
  if (platform === "edge") return "Install on Edge Add-ons";
  if (platform === "other") return "Install extension";
  return "Install on Chrome Web Store";
}

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
  price_usd?: number | string | null;
  profiles: unknown;
};

function formatPriceUsd(price: number | string | null | undefined): string {
  const n = typeof price === "number" ? price : Number(price ?? NaN);
  if (!Number.isFinite(n) || n <= 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

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
    alternates: { canonical: await canonicalUrl(extensionListingHref(row)) },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && listing.owner_id && listing.owner_id === user.id);

  const { data: badgeRows } = await supabase.from("listing_verification_badges").select("badge_key").eq("listing_id", id);
  const verificationBadgeKeys = (badgeRows ?? []).map((r: { badge_key: string }) => r.badge_key);

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
  const makerUsername =
    owner && typeof owner === "object" && "username" in owner
      ? String((owner as { username?: string | null }).username ?? "").trim() || null
      : null;
  const isCurated = listing.owner_id == null || listing.is_platform_curated === true;
  const attribution = isCurated
    ? `${SITE_NAME} curated pick`
    : owner?.full_name || owner?.username
      ? `By @${makerUsername || "maker"}`
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
  const priceLabel = formatPriceUsd(listing.price_usd);
  const extId = listing.extension_id as string | undefined;
  const upvotes = (listing as { upvote_count?: number }).upvote_count ?? 0;
  const storePlatform = parseStorePlatform(
    (listing as { store_platform?: string | null }).store_platform,
  );
  const platformLabel = STORE_PLATFORM_LABELS[storePlatform];
  const installLabel = installButtonLabel(storePlatform);
  const listedForSale = Boolean((listing as { listed_for_sale?: boolean | null }).listed_for_sale);

  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-zinc-100/60 to-zinc-50">
      <ExtensionViewTracker listingId={id} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
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
            {verificationBadgeKeys.length > 0 ? (
              <div className="mt-3">
                <VerificationBadgeRow badgeKeys={verificationBadgeKeys} />
              </div>
            ) : null}

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

          <div className="px-6 py-8 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                {listedForSale ? (
                  <aside className="scroll-mt-24 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 p-5 shadow-sm sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/90">For buyers</p>
                    <h2 className="mt-2 text-lg font-bold tracking-tight text-emerald-950">This extension is listed for acquisition</h2>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-900/85">
                      The maker opted into our{" "}
                      <Link href="/sell" className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950">
                        Sell marketplace
                      </Link>
                      . You can reach them through their public profile (website and social links), or leave a public comment below
                      (signing in required to post).
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {!isCurated && makerUsername ? (
                        <Link
                          href={`/u/${makerUsername}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/15 transition hover:from-emerald-700 hover:to-emerald-800"
                        >
                          Contact maker
                        </Link>
                      ) : !isCurated ? (
                        <Link
                          href="#listing-comments"
                          className="inline-flex items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-50/80"
                        >
                          Message via comments
                        </Link>
                      ) : (
                        <Link
                          href="/contact"
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/15 transition hover:from-emerald-700 hover:to-emerald-800"
                        >
                          Contact {SITE_NAME}
                        </Link>
                      )}
                      <Link
                        href="/sell"
                        className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50/80"
                      >
                        Browse Sell
                      </Link>
                    </div>
                    {!isOwner ? (
                      <div className="mt-5 border-t border-emerald-100/80 pt-5">
                        <ListingInquiryForm listingId={id} />
                      </div>
                    ) : (
                      <p className="mt-5 border-t border-emerald-100/80 pt-5 text-xs text-emerald-900/85">
                        Buyer inquiries appear in your{" "}
                        <Link href="/dashboard/inquiries" className="font-semibold underline">
                          Dashboard → Inquiries
                        </Link>
                        .
                      </p>
                    )}
                  </aside>
                ) : null}

                <section className="rounded-2xl border border-zinc-100 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">Overview</h2>
                  <div className="mt-4 space-y-4 text-zinc-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: (props) => <h3 className="text-2xl font-black tracking-tight text-zinc-900" {...props} />,
                        h2: (props) => <h4 className="text-xl font-bold tracking-tight text-zinc-900" {...props} />,
                        h3: (props) => <h5 className="text-lg font-semibold text-zinc-900" {...props} />,
                        p: (props) => <p className="text-base leading-relaxed" {...props} />,
                        ul: (props) => <ul className="list-disc space-y-1 pl-6 text-base leading-relaxed" {...props} />,
                        ol: (props) => <ol className="list-decimal space-y-1 pl-6 text-base leading-relaxed" {...props} />,
                        li: (props) => <li className="leading-relaxed" {...props} />,
                        blockquote: (props) => (
                          <blockquote className="border-l-4 border-zinc-200 pl-4 italic text-zinc-600" {...props} />
                        ),
                        a: (props) => <a className="font-medium text-orange-600 underline hover:text-orange-700" {...props} />,
                        code: (props) => <code className="rounded bg-zinc-100 px-1 py-0.5 text-[0.95em]" {...props} />,
                      }}
                    >
                      {listing.description}
                    </ReactMarkdown>
                  </div>
                </section>

                <div className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 sm:grid-cols-2">
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
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Languages</p>
                    <p className="mt-1 text-sm font-medium text-zinc-800">{listing.languages.join(", ")}</p>
                  </div>
                </div>

                <ExtensionCommentsSection listingId={id} comments={comments} />
              </div>

              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Asking price</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{priceLabel}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Active users</p>
                      <p className="mt-1 font-bold tabular-nums text-zinc-900">{listing.current_users.toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Uninstalls (30d)</p>
                      <p className="mt-1 font-bold tabular-nums text-zinc-900">
                        {listing.uninstalls_last_30_days.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Page views</p>
                      <p className="mt-1 font-bold tabular-nums text-zinc-900">{views.toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Store clicks</p>
                      <p className="mt-1 font-bold tabular-nums text-zinc-900">{clicks.toLocaleString("en-US")}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {listing.store_url ? (
                      <TrackedStoreLink
                        listingId={id}
                        href={listing.store_url}
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                      >
                        {installLabel}
                      </TrackedStoreLink>
                    ) : null}

                    <ListingUpvote listingId={id} initialCount={upvotes} />

                    {makerUsername ? (
                      <Link
                        href={`/u/${makerUsername}`}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:border-orange-200 hover:text-orange-700"
                      >
                        View maker profile
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Safety</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Always verify permissions, ratings, and publisher details in the official store before installing.
                  </p>
                </div>

                <ReportListingButton listingId={id} />
              </aside>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
