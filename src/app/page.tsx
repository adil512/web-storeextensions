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
    title:
      "Promote Chrome Extensions: No-1 Chrome Extension Marketplace for Buy & Sell Extensions",
    description:
      "Promote Chrome Extensions: No-1 Chrome Extension Marketplace for Buy & Sell Extensions. List your browser extensions free and reach more users for free. Our extension marketplace lets developers submit, manage listings, and showcase Chrome extensions to a growing audience.",
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

  const [
    { data: featuredRows, error: featuredError },
    { data: listings, error, count: latestCount },
    { data: makerRows },
  ] =
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
      supabase.rpc("leaderboard_makers", { p_limit: 6 }),
    ]);

  const featured = featuredRows ?? [];
  const queryError = error ?? featuredError;
  const totalLatest = latestCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLatest / PAGE_SIZE));

  if (requestedPage > totalPages) {
    redirect(`/?page=${totalPages}#browse`);
  }

  const currentPage = Math.min(requestedPage, totalPages);
  const topMakers = (makerRows as Record<string, unknown>[] | null | undefined) ?? [];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I list my browser extension on WebstoreExtensions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can list your browser extension by submitting your extension details through our submission form. Provide your extension name, description, official store link (Chrome Web Store, Firefox Add-ons, etc.), category, and relevant screenshots. Once submitted, our team reviews and publishes your listing.",
        },
      },
      {
        "@type": "Question",
        name: "What information is required to submit an extension?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "To submit successfully, include extension name, short and detailed description, price, official extension store URL, category, and recommended screenshots or logo. Complete and accurate information improves approval chances and visibility.",
        },
      },
      {
        "@type": "Question",
        name: "Is submission free or paid?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Basic submission is completely free. If you want featured exposure and selling-focused visibility, check our Pricing plans.",
        },
      },
      {
        "@type": "Question",
        name: "Can I list extensions from multiple browsers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can submit extensions from multiple browsers as long as they are officially published on supported stores like Chrome, Firefox, Edge, or others.",
        },
      },
      {
        "@type": "Question",
        name: "Which browsers are supported for extension listings?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We support extensions from major browsers, including Google Chrome, Mozilla Firefox, Microsoft Edge, Brave Browser, and Opera.",
        },
      },
      {
        "@type": "Question",
        name: "Can I submit a Chrome extension only?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, you can list both extensions and themes as long as they are already published on the Chrome Web Store.",
        },
      },
      {
        "@type": "Question",
        name: "How long does the review process take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most submissions are reviewed within 24 to 72 hours. It may take longer during peak times or if additional verification is required.",
        },
      },
      {
        "@type": "Question",
        name: "Why was my extension not approved?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Common reasons include invalid or broken links, incomplete or misleading content, policy violations, harmful features, or duplicate submissions. Ensure all information is accurate and compliant.",
        },
      },
      {
        "@type": "Question",
        name: "Do you manually review submissions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, every submission is manually reviewed to ensure quality, accuracy, and trustworthiness for users.",
        },
      },
      {
        "@type": "Question",
        name: "Can I update my extension listing after submission?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can request updates at any time. You have full control in your dashboard where you can edit, update, or remove your submissions.",
        },
      },
      {
        "@type": "Question",
        name: "Can I add new features or screenshots later?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can update your listing with new screenshots, features, or descriptions anytime to keep it current and optimized.",
        },
      },
      {
        "@type": "Question",
        name: "How can I improve my extension’s visibility?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use a clear keyword-rich description, add high-quality screenshots, choose the correct category, and keep your listing updated. Optimized listings perform better and attract more users.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer featured or promoted listings?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, this is one of our key features. Check the Pricing page for details. Once payment is confirmed, featured placement is added quickly.",
        },
      },
      {
        "@type": "Question",
        name: "Is WebstoreExtensions affiliated with browser stores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, WebstoreExtensions is an independent platform and is not officially affiliated with Google, Mozilla, Microsoft, or any browser vendors.",
        },
      },
      {
        "@type": "Question",
        name: "Can I list private or unpublished extensions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, only publicly available extensions from official browser stores are allowed.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a limit on how many extensions I can submit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There is no strict limit, but all submissions must be unique and comply with our quality guidelines.",
        },
      },
      {
        "@type": "Question",
        name: "How do users access my extension?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Users can open your listing and then click through to the official browser store page to install your extension.",
        },
      },
    ],
  };
  const orgWebsiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://webstoreextensions.com/#organization",
        name: "Web Store Extensions",
        url: "https://webstoreextensions.com/",
        email: "support@webstoreextensions.com",
        logo: {
          "@type": "ImageObject",
          url: "https://webstoreextensions.com/",
        },
        sameAs: [
          "https://www.facebook.com/webstoreextensions",
          "https://www.linkedin.com/company/web-store-extensions/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://webstoreextensions.com/#website",
        url: "https://webstoreextensions.com/",
        name: "Web Store Extensions",
        publisher: {
          "@id": "https://webstoreextensions.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://webstoreextensions.com/?s={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": "https://webstoreextensions.com/#breadcrumb",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://webstoreextensions.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Community",
        item: "https://webstoreextensions.com/community",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Sell",
        item: "https://webstoreextensions.com/sell",
      },
    ],
  };
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://webstoreextensions.com/sell",
    url: "https://webstoreextensions.com/sell",
    name: "Sell Browser Extensions",
    isPartOf: {
      "@id": "https://webstoreextensions.com/#website",
    },
    breadcrumb: {
      "@id": "https://webstoreextensions.com/#breadcrumb",
    },
    description:
      "List and promote your browser extensions on Web Store Extensions. Submit your extension and reach more users across Chrome, Firefox, Edge, and other platforms.",
  };

  return (
    <div className="bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgWebsiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
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

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Makers</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Connect with Developers</h2>
            <p className="mt-2 text-sm text-zinc-600">Discover top contributors and explore their public profiles.</p>
          </div>
          <Link href="/leaderboard" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            View full leaderboard →
          </Link>
        </div>

        {topMakers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-600">
            Top developers will appear here once profiles and listings are active.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topMakers.map((raw, idx) => {
              const username = raw.username != null ? String(raw.username) : "";
              const fullName = raw.full_name != null ? String(raw.full_name).trim() : "";
              const listingCount = Number(raw.listing_count ?? 0);
              const upvotes = Number(raw.total_upvotes ?? 0);
              const display = fullName || (username ? `@${username}` : "Member");
              const initials = (fullName || username || "?").replace(/^@/, "").slice(0, 2).toUpperCase();
              return (
                <li key={`${username}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-50 text-sm font-bold text-orange-900">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      {username ? (
                        <Link href={`/u/${username}`} className="truncate text-base font-semibold text-zinc-900 hover:text-orange-700">
                          {display}
                        </Link>
                      ) : (
                        <p className="truncate text-base font-semibold text-zinc-900">{display}</p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">{username ? `@${username}` : "No public username"}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Extensions</p>
                      <p className="mt-0.5 font-bold tabular-nums text-zinc-900">{listingCount.toLocaleString("en-US")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Upvotes</p>
                      <p className="mt-0.5 font-bold tabular-nums text-zinc-900">{upvotes.toLocaleString("en-US")}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HomeCta />
      <TrustedPlatformsSection />
      <HomeFaq />
    </div>
  );
}
