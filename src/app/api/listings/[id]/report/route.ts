import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const { id: listingId } = await ctx.params;
  const { supabase, user } = await requireAuth();
  const body = await request.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim();
  const details = String(body?.details ?? "").trim() || null;

  if (reason.length < 3) {
    return NextResponse.json({ error: "Please provide a reason (at least 3 characters)." }, { status: 400 });
  }

  const { error } = await supabase.from("listing_reports").insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason,
    details,
    status: "open",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
