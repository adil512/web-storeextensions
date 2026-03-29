import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_SLUG_LEN = 96;

/** URL-safe slug from listing title (lowercase, hyphens). */
export function slugifyListingTitle(title: string): string {
  const s = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LEN);
  return s || "extension";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isListingUuidParam(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** Public path for an approved listing (use DB slug only). */
export function extensionPublicHref(slug: string): string {
  return `/extensions/${slug}`;
}

/** Prefer slug URL; fall back to id when slug is missing (pre-migration or legacy rows). */
export function extensionListingHref(listing: { id: string; slug?: string | null }): string {
  const s = listing.slug?.trim();
  if (s) return `/extensions/${s}`;
  return `/extensions/${listing.id}`;
}

/**
 * Allocate a unique slug: base, then base-2, base-3, …
 * excludeListingId: treat slug as free if only that row holds it (title change).
 */
export async function allocateListingSlug(
  supabase: SupabaseClient,
  title: string,
  excludeListingId?: string,
): Promise<string> {
  const base = slugifyListingTitle(title);
  for (let n = 1; n <= 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await supabase.from("extension_listings").select("id").eq("slug", candidate).maybeSingle();
    const taken = data != null && (!excludeListingId || data.id !== excludeListingId);
    if (!taken) return candidate;
  }
  throw new Error("Could not allocate a unique listing slug.");
}
