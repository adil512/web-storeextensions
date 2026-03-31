import Link from "next/link";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/brand";
import { ApprovedMarketplacePanel } from "@/components/dashboard/approved-marketplace-panel";
import { extensionListingHref } from "@/lib/listing-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("extension_listings").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage your profile and extensions on {SITE_NAME}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.username ? (
            <Link
              href={`/u/${profile.username}`}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
            >
              View profile
            </Link>
          ) : null}
          <Link href="/account" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Edit Profile
          </Link>
          <Link
            href="/submit"
            className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/20"
          >
            Submit Extension
          </Link>
          <Link
            href="/dashboard/inquiries"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
          >
            Inquiries
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-bold text-zinc-900">Profile</h2>
        <p className="mt-2 text-sm text-zinc-700">{profile?.full_name || "No name set"} (@{profile?.username || "no-username"})</p>
      </div>

      <div className="mt-6 space-y-3">
        {(listings ?? []).map((listing) => (
          <div key={listing.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{listing.name}</h3>
                <p className="text-sm text-zinc-600">{listing.category}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">ID: {(listing as { extension_id?: string }).extension_id ?? "—"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase">{listing.status}</span>
                {listing.status === "pending" ? (
                  <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100"
                  >
                    Edit (saves history)
                  </Link>
                ) : null}
                {listing.status === "approved" ? (
                  <Link
                    href={extensionListingHref({ id: listing.id, slug: (listing as { slug?: string | null }).slug })}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    View public page
                  </Link>
                ) : null}
              </div>
            </div>
            {listing.status === "approved" ? (
              <ApprovedMarketplacePanel
                listingId={listing.id}
                slug={String((listing as { slug?: string | null }).slug ?? "")}
                initialListedForSale={Boolean((listing as { listed_for_sale?: boolean }).listed_for_sale)}
                initialCurrentUsers={(listing as { current_users?: number | null }).current_users ?? null}
                initialPrimaryCountry={(listing as { listing_country?: string | null }).listing_country ?? null}
              />
            ) : null}
          </div>
        ))}
        {listings?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
            No submissions yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
