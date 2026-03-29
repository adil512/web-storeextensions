import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Blog · ${SITE_NAME}`,
  description: "Guides and updates for browser extension makers—listings, Manifest V3, store polish, and growth.",
  alternates: { canonical: canonicalUrl("/blog") },
};

export type BlogListRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  created_at: string;
  cover_image_url: string | null;
};

function formatBlogDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function BlogIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,created_at,cover_image_url,body")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const posts = (rows ?? []) as (BlogListRow & { body: string })[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200/90 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Blog</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            Blog table not found. Run <code className="rounded bg-amber-100 px-1 font-mono text-xs">0015_blog_posts.sql</code>{" "}
            on Supabase, then refresh.
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white py-20 text-center text-zinc-500">
            No published posts yet. Super admins can add articles from the admin dashboard.
          </div>
        ) : (
          <ul className="grid gap-8 lg:grid-cols-2">
            {posts.map((post) => {
              const readMin = estimateReadMinutes(post.body);
              return (
                <li key={post.slug}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_24px_60px_-40px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-orange-200/60 hover:shadow-xl">
                    <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-orange-100/80 to-zinc-100">
                      {post.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.cover_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/15 via-zinc-100 to-amber-400/10">
                          <span className="text-6xl font-black text-orange-200/80" aria-hidden>
                            ⟨⟩
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </Link>
                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <time dateTime={post.created_at}>{formatBlogDate(post.created_at)}</time>
                        <span aria-hidden>·</span>
                        <span>{readMin} min read</span>
                      </div>
                      <h2 className="mt-3 text-xl font-black leading-snug tracking-tight text-zinc-950 sm:text-2xl">
                        <Link href={`/blog/${post.slug}`} className="transition hover:text-orange-600">
                          {post.title}
                        </Link>
                      </h2>
                      {post.excerpt ? (
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 sm:text-base">{post.excerpt}</p>
                      ) : null}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-600 transition group-hover:gap-3 hover:text-orange-700"
                      >
                        Read article
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
