import { canonicalUrl } from "@/lib/site-url";

/**
 * Resolve metadata canonical from admin field: absolute URL, site path, or default.
 */
export async function resolveBlogCanonical(
  stored: string | null | undefined,
  defaultPath: string,
): Promise<string> {
  const d = defaultPath.startsWith("/") ? defaultPath : `/${defaultPath}`;
  const s = stored?.trim();
  if (!s) return canonicalUrl(d);
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return canonicalUrl(path);
}
