import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/lib/site-url";

/** Per-request so sitemap URL uses the visitor’s host (custom domain), not a baked *.vercel.app URL. */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await publicSiteOrigin();
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
