import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Authenticated buyers: start an inquiry on an approved, for-sale listing (not your own). */
export async function POST(request: Request, ctx: Ctx) {
  const { id: listingId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required to send an inquiry." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const offerHint = typeof body.offerHint === "string" ? body.offerHint.trim().slice(0, 500) : "";
  if (message.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 });
  }
  if (message.length > 8000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const { data: listing, error: loadErr } = await supabase
    .from("extension_listings")
    .select("id, owner_id, status, listed_for_sale")
    .eq("id", listingId)
    .maybeSingle();

  if (loadErr || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.status !== "approved") {
    return NextResponse.json({ error: "Inquiries are only available for approved listings." }, { status: 400 });
  }
  if (!listing.listed_for_sale) {
    return NextResponse.json({ error: "This listing is not on the Sell marketplace." }, { status: 400 });
  }
  if (!listing.owner_id || listing.owner_id === user.id) {
    return NextResponse.json({ error: "You cannot inquire on your own listing." }, { status: 400 });
  }

  const { data: inserted, error: insErr } = await supabase
    .from("listing_inquiries")
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      message,
      offer_hint: offerHint || null,
      status: "open",
    })
    .select("id")
    .single();

  if (insErr) {
    if (insErr.code === "23505") {
      const { data: existing } = await supabase
        .from("listing_inquiries")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .eq("status", "open")
        .maybeSingle();
      if (existing?.id) {
        return NextResponse.json(
          { error: "You already have an open inquiry for this listing.", inquiryId: existing.id },
          { status: 409 },
        );
      }
    }
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  revalidatePath("/dashboard/inquiries");
  revalidatePath(`/dashboard/inquiries/${inserted.id}`);

  return NextResponse.json({ ok: true, inquiryId: inserted.id });
}
