import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Buyer or seller: close an open inquiry. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id: inquiryId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.status !== "closed") {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const { data: inquiry, error: iqErr } = await supabase
    .from("listing_inquiries")
    .select("id, status, buyer_id, listing_id")
    .eq("id", inquiryId)
    .maybeSingle();

  if (iqErr || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
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

  const { error: upErr } = await supabase
    .from("listing_inquiries")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", inquiryId)
    .eq("status", "open");

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  revalidatePath("/dashboard/inquiries");
  revalidatePath(`/dashboard/inquiries/${inquiryId}`);

  return NextResponse.json({ ok: true });
}
