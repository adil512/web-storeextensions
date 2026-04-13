import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FeaturedListingsSlider from "@/components/featured-listings-slider";
import HeroBrowserRow from "@/components/hero-browser-row";
import HomeCta from "@/components/home-cta";
import HomeFaq from "@/components/home-faq";
import HomeLatestApproved, { PAGE_SIZE } from "@/components/home-latest-approved";
import TrustedPlatformsSection from "@/components/trusted-platforms-section";
import { categoryHref } from "@/lib/category-slugs";
import { CATEGORIES } from "@/lib/constants/listing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const raw = String(sp.page ?? "").trim();
  const isPaginated = raw !== "" && raw !== "1" && /^\d+$/.test(raw);
  const canonicalPath = isPaginated ? `/?page=${raw}` : "/";

  return {
    title: "Submit Your Browser Extension & Get Users – Chrome, Firefox Extension Marketplace",
    description:
      "List your browser extensions free and reach more users for free. Our extension marketplace lets developers submit, manage listings, and showcase Chrome, Firefox, and Edge extensions to a growing audience.",
    alternates: { canonical: await canonicalUrl(canonicalPath) },
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const sp = await searchParams;
  const parsed = Number.parseInt(String(sp.page ?? "1"), 10);
  const requestedPage = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

  const from = (requestedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: featuredRows, error: featuredError }, { data: listings, error, count: latestCount }] =
    await Promise.all([
      supabase
        .from("extension_listings")
        .select("id,slug,name,description,category,current_users,languages,store_url,price_usd")
        .eq("status", "approved")
        .not("featured_order", "is", null)
        .order("featured_order", { ascending: true }),
      supabase
        .from("extension_listings")
        .select("id,slug,name,category,current_users,languages,featured_order,price_usd", { count: "exact" })
        .eq("status", "approved")
        .order("featured_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to),
    ]);

  const featured = featuredRows ?? [];
  const queryError = error ?? featuredError;
  const totalLatest = latestCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLatest / PAGE_SIZE));

  if (requestedPage > totalPages) {
    redirect(`/?page=${totalPages}#browse`);
  }

  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <div className="bg-zinc-50">
      {/* Full-width SaaS hero */}
      <section className="relative w-full overflow-hidden border-b border-zinc-200/90 bg-gradient-to-b from-white via-zinc-50/90 to-zinc-100/80">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(24 24 27 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(24 24 27 / 0.06) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-50 to-transparent" />

        <div className="relative mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
          <p className="mx-auto inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white/90 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 shadow-sm backdrop-blur-sm">
            #1 Browser Extension Directory
          </p>

          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-4xl font-black leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl sm:leading-[1.06] lg:text-6xl">
            Launch, Discover & Grow Browser Extensions
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg sm:leading-8">
            Browse, discover, and submit browser extensions in one moderated directory — {SITE_NAME} for Chrome, Firefox,
            Edge, and more.
          </p>

          <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-8 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
            >
              Submit your extension
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Sign up free
            </Link>
            <Link
              href="#browse"
              className="inline-flex h-12 items-center justify-center px-4 text-sm font-semibold text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-400 sm:px-6"
            >
              Browse listings
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Free to submit · Moderated listings
          </p>

          <HeroBrowserRow />
        </div>
      </section>

      {queryError ? (
        <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Database setup incomplete. Run `supabase/migrations/0001_init.sql` (and `0002_curated_featured_extensions.sql` for
            featured picks), then refresh.
          </div>
        </section>
      ) : null}

      <section id="browse" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-8 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Featured Listings</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Handpicked this week</span>
        </div>
        <FeaturedListingsSlider listings={featured} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Explore Categories</h2>
          <p className="text-sm text-zinc-500">Choose one category while submitting</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={categoryHref(category)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-900"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <HomeLatestApproved listings={listings ?? []} totalCount={totalLatest} currentPage={currentPage} />

      <HomeFaq />
      <HomeCta />
      <TrustedPlatformsSection />
    </div>
  );
}
