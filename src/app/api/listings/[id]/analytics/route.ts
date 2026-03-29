import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteCtx = { params: Promise<{ id: string }> };

/** Public: increment page views or store outbound clicks for approved listings. */
export async function POST(request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const type = body?.type === "store_click" ? "store_click" : "view";

  const supabase = await createSupabaseServerClient();
  const rpc = type === "store_click" ? "increment_listing_store_click" : "increment_listing_view";
  const { error } = await supabase.rpc(rpc, { p_id: id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
