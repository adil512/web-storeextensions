import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

/** Cached; update when you change disallow rules. */
export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/account", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
