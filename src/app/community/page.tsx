import type { Metadata } from "next";
import { CommunityComposer } from "@/components/community/community-composer";
import { CommunityFeed } from "@/components/community/community-feed";
import type { CommunityPostFeedRow } from "@/lib/community";
import { COMMUNITY_INITIAL_PAGE_SIZE, utcDayStartIso } from "@/lib/community";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Extension Community – Share, Discuss & Discover Browser Extensions",
    description:
      "Join the browser extension community to share links, post updates, upvote, and comment on extensions. Connect with developers and users, discover trending tools, and engage around Chrome, Firefox, and Edge extensions.",
    alternates: { canonical: await canonicalUrl("/community") },
  };
}

function mapRpcRows(rows: Record<string, unknown>[]): CommunityPostFeedRow[] {
  return rows.map((r) => ({
    id: String(r.id),
    author_id: String(r.author_id),
    body: String(r.body),
    links: r.links,
    comment_count: Number(r.comment_count ?? 0),
    created_at: String(r.created_at),
    username: r.username != null ? String(r.username) : null,
    full_name: r.full_name != null ? String(r.full_name) : null,
  }));
}

export default async function CommunityPage() {
  const supabase = await createSupabaseServerClient();

  const { data: rpcData, error: rpcError } = await supabase.rpc("community_posts_page", {
    page_limit: COMMUNITY_INITIAL_PAGE_SIZE,
    p_after_created: null,
    p_after_id: null,
  });

  const initialPosts: CommunityPostFeedRow[] = !rpcError && rpcData ? mapRpcRows(rpcData as Record<string, unknown>[]) : [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let postedTodayUtc = false;
  if (user) {
    const { count } = await supabase
      .from("community_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .gte("created_at", utcDayStartIso());
    postedTodayUtc = (count ?? 0) > 0;
  }

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <header className="border-b border-zinc-200/90 bg-white">
        <div className="mx-auto max-w-2xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" aria-hidden />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[2rem] sm:leading-tight">
            Community
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        {rpcError ? (
          <div className="mb-8 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            Unable to load posts.
          </div>
        ) : null}

        <div className="flex flex-col gap-10">
          <CommunityComposer isLoggedIn={!!user} postedTodayUtc={postedTodayUtc} />
          <CommunityFeed initialPosts={initialPosts} currentUserId={user?.id ?? null} isLoggedIn={!!user} />
        </div>
      </div>
    </div>
  );
}
