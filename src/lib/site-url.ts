import { headers } from "next/headers";

/** Public site origin for canonical URLs. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yoursite.com). */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return "http://localhost:3000";
}

/**
 * Origin for sitemap / robots / SEO: prefers NEXT_PUBLIC_SITE_URL, then the incoming request host
 * (so custom domains on Vercel resolve correctly without env), then siteOrigin().
 */
export async function publicSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  try {
    const h = await headers();
    const rawHost =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host")?.trim() || "";
    if (rawHost && rawHost !== "localhost" && !rawHost.startsWith("127.")) {
      let proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
      if (proto !== "http" && proto !== "https") proto = "https";
      return `${proto}://${rawHost}`.replace(/\/$/, "");
    }
  } catch {
    /* no request context (e.g. some static paths) */
  }

  return siteOrigin();
}

/**
 * Absolute canonical URL for the current request (custom domain or NEXT_PUBLIC_SITE_URL).
 * Use in generateMetadata / server components; pass path including query when needed (e.g. `/?page=2`).
 */
export async function canonicalUrl(path: string): Promise<string> {
  const origin = (await publicSiteOrigin()).replace(/\/$/, "");
  if (!path || path === "/") return `${origin}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}
