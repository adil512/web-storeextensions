import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogAuthorCard } from "@/components/blog/blog-author-card";
import { BlogCommentsBlock, type ApprovedBlogComment } from "@/components/blog/blog-comments-block";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { BlogPostExploreAside, BlogPostTocUnderHeading } from "@/components/blog/blog-post-sidebar";
import { BLOG_AUTHOR } from "@/lib/blog-author";
import { SITE_NAME } from "@/lib/brand";
import { resolveBlogCanonical } from "@/lib/blog-canonical";
import { extractTocFromMarkdown } from "@/lib/blog-toc";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

function formatBlogDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title,excerpt,meta_title,meta_description,canonical_url,slug")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const post = data as BlogPostRow | null;
  if (!post) return { title: "Blog" };

  const title = post.meta_title?.trim() || `${post.title} · Blog · ${SITE_NAME}`;
  const description = post.meta_description?.trim() || post.excerpt || `Read ${post.title} on ${SITE_NAME}.`;
  const canonical = await resolveBlogCanonical(post.canonical_url, `/blog/${post.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle();

  const post = data as BlogPostRow | null;
  if (!post) notFound();

  const readMin = estimateReadMinutes(post.body);
  const toc = extractTocFromMarkdown(post.body);
  const canonical = await resolveBlogCanonical(post.canonical_url, `/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    description: post.excerpt || post.meta_description || undefined,
    url: canonical,
    publisher: { "@type": "Organization", name: SITE_NAME },
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      url: BLOG_AUTHOR.website,
      sameAs: [BLOG_AUTHOR.twitter, BLOG_AUTHOR.linkedin],
    },
  };

  const { data: commentRows, error: commentsError } = await supabase
    .from("blog_post_comments")
    .select("id,author_name,body,website_url,created_at")
    .eq("blog_post_id", post.id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  const approvedComments: ApprovedBlogComment[] =
    !commentsError && commentRows
      ? commentRows.map((r) => ({
          id: r.id,
          author_name: r.author_name,
          body: r.body,
          website_url: r.website_url,
          created_at: r.created_at,
        }))
      : [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        <header className="relative border-b border-zinc-200/90 bg-white">
          {post.cover_image_url ? (
            <div className="relative mx-auto max-w-7xl">
              <div className="aspect-[21/9] w-full overflow-hidden bg-zinc-200 sm:rounded-b-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 to-transparent sm:rounded-b-3xl" />
            </div>
          ) : null}

          <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-12">
            <nav className="text-sm text-zinc-500">
              <Link href="/blog" className="font-semibold text-orange-600 transition hover:text-orange-700">
                Blog
              </Link>
              <span className="mx-2 text-zinc-300">/</span>
              <span className="line-clamp-1 text-zinc-600">{post.title}</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <time dateTime={post.created_at}>{formatBlogDate(post.created_at)}</time>
              <span className="h-1 w-1 rounded-full bg-zinc-300" aria-hidden />
              <span>{readMin} min read</span>
            </div>

            <h1 className="mt-4 max-w-4xl text-balance text-3xl font-black leading-[1.15] tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600 sm:text-xl">{post.excerpt}</p>
            ) : null}

            <BlogPostTocUnderHeading items={toc} />

            <div className="mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-12 xl:gap-12">
            <div className="xl:col-span-9">
              <div className="rounded-[2rem] border border-zinc-200/80 bg-white px-5 py-10 shadow-sm sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                <BlogMarkdown source={post.body} />
              </div>

              <BlogAuthorCard />

              <BlogCommentsBlock blogPostId={post.id} comments={approvedComments} />

              <div className="mt-10 xl:hidden">
                <BlogPostExploreAside />
              </div>

              <div className="mt-12 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <p className="text-sm font-bold text-zinc-900">Enjoyed this article?</p>
                  <p className="mt-1 text-sm text-zinc-600">List your extension in our moderated directory.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                  >
                    Submit extension
                  </Link>
                  <Link
                    href="/blog"
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  >
                    More posts
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden xl:col-span-3 xl:block">
              <div className="sticky top-28">
                <BlogPostExploreAside />
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
