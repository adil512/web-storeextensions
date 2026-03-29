/** Public site origin for canonical URLs. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yoursite.com). */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return "http://localhost:3000";
}

/** Absolute canonical URL. Pass path including query when needed (e.g. `/?page=2`). */
export function canonicalUrl(path: string): string {
  const origin = siteOrigin();
  if (!path || path === "/") return `${origin}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}
