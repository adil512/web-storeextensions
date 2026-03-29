"use client";

import Link from "next/link";
import { extensionListingHref } from "@/lib/listing-slug";

export type FeaturedListingCard = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  category: string;
  current_users: number;
  store_url: string | null;
};

function FeaturedCard({ listing }: { listing: FeaturedListingCard }) {
  return (
    <article className="flex h-full w-[min(85vw,300px)] shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:w-[280px]">
      <Link href={extensionListingHref({ id: listing.id, slug: listing.slug })} className="group flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-orange-800">
            Featured
          </span>
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{listing.category}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-zinc-900 group-hover:text-orange-700">{listing.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-zinc-600">{listing.description}</p>
        <p className="mt-3 text-[11px] font-medium text-zinc-500">{listing.current_users.toLocaleString()} active users</p>
      </Link>
      {listing.store_url ? (
        <a
          href={listing.store_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-orange-200 bg-orange-50/50 py-2 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-50"
        >
          Chrome Web Store →
        </a>
      ) : null}
    </article>
  );
}

export default function FeaturedListingsSlider({ listings }: { listings: FeaturedListingCard[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
        Featured block appears when approved listings are available.
      </div>
    );
  }

  const track = listings.length > 1 ? [...listings, ...listings] : listings;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-zinc-50 to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-50 to-transparent sm:w-16"
        aria-hidden
      />
      <div className="overflow-hidden py-1">
        <div
          className={`featured-marquee-track flex gap-3 sm:gap-4 ${listings.length > 1 ? "featured-marquee-track--animate" : "justify-center"}`}
        >
          {track.map((listing, idx) => (
            <FeaturedCard key={`${listing.id}-${idx}`} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}
