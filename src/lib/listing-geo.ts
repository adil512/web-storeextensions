/**
 * Best-effort geo from common edge / proxy headers (Vercel, Cloudflare, etc.).
 * Local dev usually has no values — columns stay null.
 */
export function getListingGeoFromRequest(request: Request): {
  listing_country: string | null;
  listing_region: string | null;
  listing_city: string | null;
} {
  const h = request.headers;

  const country =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("cloudfront-viewer-country") ||
    h.get("x-appengine-country") ||
    null;

  const region =
    h.get("x-vercel-ip-country-region") ||
    h.get("cf-region-code") ||
    h.get("cloudfront-viewer-country-region") ||
    null;

  const rawCity =
    h.get("x-vercel-ip-city") || h.get("cf-ipcity") || h.get("cloudfront-viewer-city") || null;
  const city = rawCity ? decodeGeoHeaderValue(rawCity) : null;

  return {
    listing_country: country,
    listing_region: region,
    listing_city: city,
  };
}

function decodeGeoHeaderValue(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value.replace(/\+/g, " ");
  }
}
