import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ListingUpvote } from "@/components/listing-upvote";
import { getCategorySeo } from "@/lib/category-seo";
import { categoryToSlug, slugToCategory } from "@/lib/category-slugs";
import { CATEGORIES } from "@/lib/constants/listing";
import { extensionListingHref } from "@/lib/listing-slug";
import { canonicalUrl } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slugToCategory(slug);
  if (!name) return { title: "Category" };
  const seo = getCategorySeo(name);
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    alternates: { canonical: canonicalUrl(`/categories/${slug}`) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryName = slugToCategory(slug);
  if (!categoryName) notFound();
  const seo = getCategorySeo(categoryName);

  const supabase = await createSupabaseServerClient();
  const { data: extensions, error } = await supabase
    .from("extension_listings")
    .select("id,slug,name,description,category,current_users,languages,store_url,featured_order,is_platform_curated,upvote_count")
    .eq("status", "approved")
    .eq("category", categoryName)
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = extensions ?? [];

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <div className="border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <nav className="text-sm text-zinc-500">
            <Link href="/" className="font-medium text-orange-600 hover:text-orange-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/#browse" className="hover:text-zinc-800">
              Categories
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-800">{categoryName}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{categoryName}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">{seo.intro}</p>
          <p className="mt-2 text-sm text-zinc-500">{rows.length} extension{rows.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load listings. Check your database connection.
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-zinc-600">No approved extensions in this category yet.</p>
            <Link
              href="/submit"
              className="mt-4 inline-flex rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              Submit the first one
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((listing) => (
              <div
                key={listing.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  listing.featured_order != null ? "border-orange-200/90 ring-1 ring-orange-100" : "border-zinc-200"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {listing.featured_order != null ? (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-800">
                      Featured
                    </span>
                  ) : null}
                  {listing.is_platform_curated ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                      Curated
                    </span>
                  ) : null}
                </div>
                <Link href={extensionListingHref({ id: listing.id, slug: listing.slug })} className="mt-2 block">
                  <h2 className="text-lg font-bold text-zinc-900 hover:text-orange-700">{listing.name}</h2>
                </Link>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-600">{listing.description}</p>
                <p className="mt-4 text-xs text-zinc-500">{listing.current_users.toLocaleString()} users · {listing.languages.length} languages</p>
                <div className="mt-3">
                  <ListingUpvote listingId={listing.id} initialCount={listing.upvote_count ?? 0} compact />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={extensionListingHref({ id: listing.id, slug: listing.slug })}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 sm:flex-none"
                  >
                    View details
                  </Link>
                  {listing.store_url ? (
                    <a
                      href={listing.store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 sm:flex-none"
                    >
                      Web Store
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Other categories</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== categoryName).map((c) => (
              <Link
                key={c}
                href={`/categories/${categoryToSlug(c)}`}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
