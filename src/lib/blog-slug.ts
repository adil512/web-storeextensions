const MAX = 120;

/** URL-safe blog slug (lowercase, hyphens). */
export function slugifyBlogInput(raw: string): string {
  const s = raw
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX);
  return s || "post";
}
