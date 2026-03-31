import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Buyer or seller: post a message in an open inquiry thread. */
export async function POST(request: Request, ctx: Ctx) {
  const { id: inquiryId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 1) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const { data: inquiry, error: iqErr } = await supabase
    .from("listing_inquiries")
    .select("id, status, buyer_id, listing_id")
    .eq("id", inquiryId)
    .maybeSingle();

  if (iqErr || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }
  if (inquiry.status !== "open") {
    return NextResponse.json({ error: "This conversation is closed." }, { status: 400 });
  }

  const { data: listingRow } = await supabase
    .from("extension_listings")
    .select("owner_id")
    .eq("id", inquiry.listing_id)
    .maybeSingle();
  const ownerId = listingRow?.owner_id ?? null;
  const isBuyer = inquiry.buyer_id === user.id;
  const isSeller = ownerId !== null && ownerId === user.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { error: msgErr } = await supabase.from("deal_messages").insert({
    inquiry_id: inquiryId,
    author_id: user.id,
    body: text,
  });

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 400 });
  }

  revalidatePath("/dashboard/inquiries");
  revalidatePath(`/dashboard/inquiries/${inquiryId}`);

  return NextResponse.json({ ok: true });
}
