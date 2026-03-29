import { CATEGORIES } from "@/lib/constants/listing";

export type CategoryName = (typeof CATEGORIES)[number];

export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugToCategory(slug: string): CategoryName | null {
  const normalized = slug.toLowerCase();
  for (const c of CATEGORIES) {
    if (categoryToSlug(c) === normalized) {
      return c;
    }
  }
  return null;
}

export function categoryHref(category: string): string {
  return `/categories/${categoryToSlug(category)}`;
}
