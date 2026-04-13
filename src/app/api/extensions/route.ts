import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isValidExtensionId, normalizeExtensionId } from "@/lib/extension-id";
import { getListingGeoFromRequest } from "@/lib/listing-geo";
import { notifyAdminNewSubmission } from "@/lib/notify-admin";
import { isValidStorePlatform, parseStorePlatform } from "@/lib/constants/listing";
import { allocateListingSlug } from "@/lib/listing-slug";

function parseOptionalPrice(raw: unknown): number | null {
  const s = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  return Math.round(n * 100) / 100;
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  const body = await request.json();
  const geo = getListingGeoFromRequest(request);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_banned) {
    return NextResponse.json({ error: "Your account is banned." }, { status: 403 });
  }

  const normExt = normalizeExtensionId(body.extensionId);
  if (!isValidExtensionId(normExt)) {
    return NextResponse.json(
      {
        error:
          "Extension ID is required (2–128 characters: letters, numbers, hyphens). Use your Chrome Web Store item ID from the listing URL.",
      },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("extension_listings")
    .select("id,name,status")
    .eq("extension_id", normExt)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (existing) {
    return NextResponse.json(
      {
        error:
          "This Extension ID is already submitted or live. Each extension can only be listed once while active. If this is yours, edit your pending listing or contact support.",
        duplicateOf: existing,
      },
      { status: 409 },
    );
  }

  if (!isValidStorePlatform(body.storePlatform)) {
    return NextResponse.json(
      { error: "Store platform is required (Google, Mozilla, Edge, or Other)." },
      { status: 400 },
    );
  }
  const store_platform = parseStorePlatform(body.storePlatform);
  const featured_placement_requested = body.requestFeaturedPlacement === true || body.requestFeaturedPlacement === "true";
  const listed_for_sale = body.listedForSale === true || body.listedForSale === "true";
  const nameTrimmed = String(body.name ?? "").trim();
  const primaryCountry = String(body.primaryCountry ?? "").trim();
  const slug = await allocateListingSlug(supabase, nameTrimmed);
  const priceUsd = parseOptionalPrice(body.priceUsd);
  if (Number.isNaN(priceUsd)) {
    return NextResponse.json({ error: "Price must be a non-negative number (e.g. 9.99)." }, { status: 400 });
  }

  const payload = {
    owner_id: user.id,
    extension_id: normExt,
    name: nameTrimmed,
    slug,
    description,
    category: body.category,
    store_platform,
    current_users: Number(body.currentUsers || 0),
    uninstalls_last_30_days: Number(body.uninstallsLast30Days || 0),
    users_by_region: body.usersByRegion || {},
    languages: body.languages || [],
    homepage_url: body.homepageUrl?.trim() || null,
    store_url: body.storeUrl?.trim() || null,
    logo_url: body.logoUrl?.trim() || null,
    price_usd: priceUsd,
    status: "pending",
    listing_country: primaryCountry || geo.listing_country,
    listing_region: geo.listing_region,
    listing_city: geo.listing_city,
    featured_placement_requested,
    listed_for_sale,
  };

  const { data: inserted, error } = await supabase.from("extension_listings").insert(payload).select("id").single();

  if (error) {
    const isDup = error.code === "23505";
    if (isDup) {
      return NextResponse.json(
        {
          error:
            "Duplicate Extension ID: another pending or approved listing already uses this ID.",
        },
        { status: 409 },
      );
    }
    const isSchemaCacheMiss = error.code === "PGRST205" || error.message.includes("schema cache");
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") ?? "unknown";
    const actionable = isSchemaCacheMiss
      ? `Supabase REST cannot see table extension_listings yet. Verify .env.local points to the same project (${supabaseHost}), run migration SQL there, then refresh API schema by opening Database > Tables once and retry in 30s.`
      : error.message;
    return NextResponse.json({ error: actionable, rawError: error.message, code: error.code }, { status: 400 });
  }

  const origin = request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
    : new URL(request.url).origin;

  void notifyAdminNewSubmission({
    listingName: String(payload.name),
    extensionId: normExt,
    submitterEmail: profile?.email,
    listingId: inserted.id,
    listingSlug: slug,
    appUrl: origin,
    featuredPlacementRequested: featured_placement_requested,
  });

  return NextResponse.json({ ok: true, id: inserted.id });
}
