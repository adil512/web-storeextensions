import Link from "next/link";
import { redirect } from "next/navigation";
import { extensionListingHref } from "@/lib/listing-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InquiryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  message: string;
  offer_hint: string | null;
  buyer_id: string;
  listing_id: string;
  extension_listings:
    | { name: string; slug: string | null; owner_id: string | null }
    | { name: string; slug: string | null; owner_id: string | null }[]
    | null;
};

function inquiryListing(row: InquiryRow) {
  const ext = row.extension_listings;
  return Array.isArray(ext) ? ext[0] ?? null : ext;
}

export default async function DashboardInquiriesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: owned } = await supabase.from("extension_listings").select("id").eq("owner_id", user.id);
  const ownedIds = (owned ?? []).map((r) => r.id);

  const [buyerRes, sellerRes] = await Promise.all([
    supabase
      .from("listing_inquiries")
      .select(
        "id, created_at, updated_at, status, message, offer_hint, buyer_id, listing_id, extension_listings ( name, slug, owner_id )",
      )
      .eq("buyer_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(200),
    ownedIds.length
      ? supabase
          .from("listing_inquiries")
          .select(
            "id, created_at, updated_at, status, message, offer_hint, buyer_id, listing_id, extension_listings ( name, slug, owner_id )",
          )
          .in("listing_id", ownedIds)
          .order("updated_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
  ]);

  const byId = new Map<string, InquiryRow>();
  for (const row of buyerRes.data ?? []) {
    byId.set(row.id, row as InquiryRow);
  }
  for (const row of sellerRes.data ?? []) {
    byId.set(row.id, row as InquiryRow);
  }
  const rows = [...byId.values()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Inquiries</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Private threads with buyers or sellers for Sell marketplace listings.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          ← Dashboard
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
          No inquiries yet. Start one from a listing on the{" "}
          <Link href="/sell" className="font-semibold text-orange-600 hover:underline">
            Sell
          </Link>{" "}
          page.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((row) => {
            const ext = inquiryListing(row);
            const role = row.buyer_id === user.id ? "Buying" : "Selling";
            const href = extensionListingHref({ id: row.listing_id, slug: ext?.slug ?? "" });
            return (
              <li key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{role}</span>
                    <h2 className="text-lg font-bold text-zinc-900">{ext?.name ?? "Listing"}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{row.message}</p>
                    <p className="mt-2 text-[10px] text-zinc-400">
                      Updated {new Date(row.updated_at).toLocaleString()} ·{" "}
                      <span className={row.status === "open" ? "font-semibold text-emerald-700" : ""}>{row.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/dashboard/inquiries/${row.id}`}
                      className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-center text-xs font-bold text-white"
                    >
                      Open deal room
                    </Link>
                    <Link href={href} className="text-center text-xs font-semibold text-zinc-600 underline">
                      View listing
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
