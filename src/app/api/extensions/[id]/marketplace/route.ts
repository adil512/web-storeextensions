import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Owner: toggle marketplace visibility and/or update reported stats on approved listings only. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (typeof body.listedForSale === "boolean") {
    const { error } = await supabase.rpc("set_extension_listed_for_sale", {
      p_listing_id: id,
      p_listed: body.listedForSale,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.currentUsers !== undefined || body.primaryCountry !== undefined) {
    const { data: row, error: loadErr } = await supabase
      .from("extension_listings")
      .select("current_users, listing_country")
      .eq("id", id)
      .maybeSingle();
    if (loadErr || !row) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    const cu =
      body.currentUsers !== undefined && body.currentUsers !== null
        ? Number(body.currentUsers)
        : Number(row.current_users ?? 0);
    const pc =
      body.primaryCountry !== undefined && body.primaryCountry !== null
        ? String(body.primaryCountry).trim()
        : String(row.listing_country ?? "").trim();
    if (Number.isNaN(cu) || cu < 0) {
      return NextResponse.json({ error: "Invalid active user count." }, { status: 400 });
    }
    const { error } = await supabase.rpc("update_extension_marketplace_metrics", {
      p_listing_id: id,
      p_current_users: cu,
      p_primary_country: pc,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  revalidatePath("/sell");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
