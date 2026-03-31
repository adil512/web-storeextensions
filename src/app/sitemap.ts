import type { MetadataRoute } from "next";
import { categoryHref } from "@/lib/category-slugs";
import { CATEGORIES } from "@/lib/constants/listing";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicSiteOrigin } from "@/lib/site-url";
import { getAllToolSlugs } from "@/lib/tools-registry";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/extension-tools", changeFrequency: "weekly", priority: 0.9 },
  { path: "/sell", changeFrequency: "daily", priority: 0.9 },
  { path: "/submit", changeFrequency: "monthly", priority: 0.9 },
  { path: "/auth", changeFrequency: "monthly", priority: 0.5 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.7 },
  { path: "/community", changeFrequency: "daily", priority: 0.7 },
  { path: "/tags", changeFrequency: "weekly", priority: 0.6 },
  { path: "/best-by-tag", changeFrequency: "weekly", priority: 0.6 },
  { path: "/products/business", changeFrequency: "monthly", priority: 0.5 },
  { path: "/products/design", changeFrequency: "monthly", priority: 0.5 },
  { path: "/products/development", changeFrequency: "monthly", priority: 0.5 },
  { path: "/products/for-sale", changeFrequency: "monthly", priority: 0.5 },
  { path: "/products/marketing", changeFrequency: "monthly", priority: 0.5 },
  { path: "/products/personal-life", changeFrequency: "monthly", priority: 0.5 },
];

function absoluteUrl(base: string, path: string): string {
  const root = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root}${p}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await publicSiteOrigin();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of STATIC_PATHS) {
    entries.push({
      url: absoluteUrl(base, path),
      lastModified: now,
      changeFrequency,
      priority,
    });
  }

  for (const cat of CATEGORIES) {
    entries.push({
      url: absoluteUrl(base, categoryHref(cat)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  for (const slug of getAllToolSlugs()) {
    entries.push({
      url: absoluteUrl(base, `/extension-tools/${slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();

    const { data: listings } = await supabase
      .from("extension_listings")
      .select("slug,updated_at")
      .eq("status", "approved");

    for (const row of listings ?? []) {
      const s = typeof row.slug === "string" ? row.slug.trim() : "";
      if (!s) continue;
      entries.push({
        url: absoluteUrl(base, `/extensions/${s}`),
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    const { data: posts } = await supabase.from("blog_posts").select("slug,updated_at").eq("published", true);

    for (const row of posts ?? []) {
      const s = typeof row.slug === "string" ? row.slug.trim() : "";
      if (!s) continue;
      entries.push({
        url: absoluteUrl(base, `/blog/${s}`),
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
