import { NextResponse } from "next/server";
import { isValidExtensionId, normalizeExtensionId } from "@/lib/extension-id";
import { CATEGORIES, isValidStorePlatform, parseStorePlatform } from "@/lib/constants/listing";
import { allocateListingSlug } from "@/lib/listing-slug";
import { snapshotFromListingRow } from "@/lib/listing-snapshot";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { countWords, MIN_LISTING_DESCRIPTION_WORDS } from "@/lib/word-count";

type RouteCtx = { params: Promise<{ id: string }> };

/** Owner may edit their own listing while status is pending (version history recorded). */
export async function PATCH(request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));

  const { data: row, error: fetchErr } = await supabase
    .from("extension_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (row.owner_id !== user.id) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  if (row.status !== "pending") {
    return NextResponse.json({ error: "Only pending listings can be edited." }, { status: 400 });
  }

  const name = body.name != null ? String(body.name).trim() : row.name;
  const description = body.description != null ? String(body.description).trim() : row.description;
  const category = body.category != null ? String(body.category).trim() : row.category;
  const extensionRaw = body.extensionId != null ? String(body.extensionId).trim() : row.extension_id;
  const normExt = normalizeExtensionId(extensionRaw);

  if (!isValidExtensionId(normExt)) {
    return NextResponse.json(
      { error: "Extension ID must be 2–128 characters (letters, numbers, hyphens only)." },
      { status: 400 },
    );
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (name.length < 2 || description.length < 1) {
    return NextResponse.json({ error: "Name and description are required." }, { status: 400 });
  }

  const words = countWords(description);
  if (words < MIN_LISTING_DESCRIPTION_WORDS) {
    return NextResponse.json(
      {
        error: `Description must be at least ${MIN_LISTING_DESCRIPTION_WORDS} words. You have ${words} word${words === 1 ? "" : "s"}.`,
      },
      { status: 400 },
    );
  }

  if (normExt !== normalizeExtensionId(String(row.extension_id))) {
    const { data: conflict } = await supabase
      .from("extension_listings")
      .select("id")
      .eq("extension_id", normExt)
      .in("status", ["pending", "approved"])
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { error: "This Extension ID is already used by another active listing." },
        { status: 409 },
      );
    }
  }

  const snapshot = snapshotFromListingRow(row as Record<string, unknown>);

  const { error: verErr } = await supabase.from("listing_versions").insert({
    listing_id: id,
    editor_id: user.id,
    snapshot,
  });

  if (verErr) {
    return NextResponse.json({ error: verErr.message }, { status: 400 });
  }

  let store_platform: ReturnType<typeof parseStorePlatform>;
  if (body.storePlatform != null && String(body.storePlatform).trim() !== "") {
    if (!isValidStorePlatform(body.storePlatform)) {
      return NextResponse.json({ error: "Invalid store platform." }, { status: 400 });
    }
    store_platform = parseStorePlatform(body.storePlatform);
  } else {
    store_platform = parseStorePlatform(row.store_platform);
  }

  let featured_placement_requested: boolean;
  if (body.requestFeaturedPlacement !== undefined && body.requestFeaturedPlacement !== null) {
    featured_placement_requested =
      body.requestFeaturedPlacement === true || body.requestFeaturedPlacement === "true";
  } else {
    featured_placement_requested = Boolean(
      (row as { featured_placement_requested?: boolean }).featured_placement_requested,
    );
  }

  let slug = String((row as { slug?: string }).slug ?? "");
  if (name !== row.name) {
    slug = await allocateListingSlug(supabase, name, id);
  }

  const updatePayload = {
    name,
    slug,
    description,
    category,
    extension_id: normExt,
    store_platform,
    current_users: body.currentUsers != null ? Number(body.currentUsers) : row.current_users,
    uninstalls_last_30_days:
      body.uninstallsLast30Days != null ? Number(body.uninstallsLast30Days) : row.uninstalls_last_30_days,
    homepage_url: body.homepageUrl != null ? String(body.homepageUrl).trim() || null : row.homepage_url,
    store_url: body.storeUrl != null ? String(body.storeUrl).trim() || null : row.store_url,
    logo_url: body.logoUrl != null ? String(body.logoUrl).trim() || null : row.logo_url,
    languages: Array.isArray(body.languages) ? body.languages : row.languages,
    users_by_region:
      body.usersByRegion && typeof body.usersByRegion === "object" ? body.usersByRegion : row.users_by_region,
    featured_placement_requested,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await supabase.from("extension_listings").update(updatePayload).eq("id", id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("extension_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.owner_id !== user.id || row.status !== "pending") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ listing: row });
}
