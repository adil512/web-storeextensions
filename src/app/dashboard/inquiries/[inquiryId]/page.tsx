import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DealRoom, type DealMessageRow } from "@/components/marketplace/deal-room";
import { extensionListingHref } from "@/lib/listing-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ inquiryId: string }> };

export default async function DashboardInquiryDealRoomPage({ params }: Props) {
  const { inquiryId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: inquiry, error: iqErr } = await supabase
    .from("listing_inquiries")
    .select("id, status, message, offer_hint, buyer_id, listing_id, created_at, updated_at")
    .eq("id", inquiryId)
    .maybeSingle();

  if (iqErr || !inquiry) notFound();

  const { data: listing } = await supabase
    .from("extension_listings")
    .select("id, name, slug, owner_id")
    .eq("id", inquiry.listing_id)
    .maybeSingle();

  if (!listing) notFound();

  const isBuyer = inquiry.buyer_id === user.id;
  const isSeller = listing.owner_id !== null && listing.owner_id === user.id;
  if (!isBuyer && !isSeller) {
    redirect("/dashboard/inquiries");
  }

  const { data: rawMsgs } = await supabase
    .from("deal_messages")
    .select("id, body, created_at, author_id, profiles!deal_messages_author_id_fkey(username)")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  const messages: DealMessageRow[] = (rawMsgs ?? []).map(
    (m: {
      id: string;
      body: string;
      created_at: string;
      author_id: string;
      profiles: { username: string | null } | { username: string | null }[] | null;
    }) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      const username = p?.username ?? null;
      return {
        id: m.id,
        body: m.body,
        created_at: m.created_at,
        author_id: m.author_id,
        author_username: username,
      };
    },
  );

  const listHref = extensionListingHref({ id: listing.id, slug: listing.slug });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/dashboard/inquiries" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
        ← All inquiries
      </Link>
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-black text-zinc-900">{listing.name}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {isBuyer ? "You are the buyer" : "You are the seller"} · Status:{" "}
          <span className="font-semibold text-zinc-800">{inquiry.status}</span>
        </p>
        <Link href={listHref} className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline">
          View public listing →
        </Link>
        <div className="mt-6">
          <DealRoom
            inquiryId={inquiry.id}
            messages={messages}
            currentUserId={user.id}
            buyerId={inquiry.buyer_id}
            inquiryOpen={inquiry.status === "open"}
            initialMessage={inquiry.message}
            offerHint={inquiry.offer_hint}
          />
        </div>
      </div>
    </div>
  );
}
