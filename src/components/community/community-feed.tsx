"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityPostFeedRow } from "@/lib/community";
import { COMMUNITY_LOAD_MORE_SIZE, COMMUNITY_INITIAL_PAGE_SIZE, encodePostsCursor } from "@/lib/community";
import { CommunityPostCard } from "@/components/community/community-post-card";

export function CommunityFeed({
  initialPosts,
  currentUserId,
  isLoggedIn,
}: {
  initialPosts: CommunityPostFeedRow[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const [posts, setPosts] = useState<CommunityPostFeedRow[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(() => {
    const last = initialPosts[initialPosts.length - 1];
    if (!last || initialPosts.length < COMMUNITY_INITIAL_PAGE_SIZE) return null;
    return encodePostsCursor(last.created_at, last.id);
  });
  const [hasMore, setHasMore] = useState(initialPosts.length >= COMMUNITY_INITIAL_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    const last = initialPosts[initialPosts.length - 1];
    setNextCursor(
      initialPosts.length >= COMMUNITY_INITIAL_PAGE_SIZE && last
        ? encodePostsCursor(last.created_at, last.id)
        : null,
    );
    setHasMore(initialPosts.length >= COMMUNITY_INITIAL_PAGE_SIZE);
  }, [initialPosts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !nextCursor) return;
    setLoading(true);
    const url = new URL("/api/community/posts", window.location.origin);
    url.searchParams.set("limit", String(COMMUNITY_LOAD_MORE_SIZE));
    url.searchParams.set("cursor", nextCursor);
    const res = await fetch(url.toString());
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return;
    const batch = (data.posts ?? []) as CommunityPostFeedRow[];
    if (batch.length === 0) {
      setHasMore(false);
      setNextCursor(null);
      return;
    }
    setPosts((prev) => [...prev, ...batch]);
    setNextCursor(data.nextCursor ?? null);
    setHasMore(!!data.nextCursor);
  }, [hasMore, loading, nextCursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) void loadMore();
      },
      { root: null, rootMargin: "280px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadMore]);

  const bumpCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)),
    );
  }, []);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white py-16 text-center shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <p className="text-sm font-medium text-zinc-500">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <CommunityPostCard
          key={p.id}
          post={p}
          currentUserId={currentUserId}
          isLoggedIn={isLoggedIn}
          onCommentPosted={bumpCommentCount}
        />
      ))}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {loading ? (
        <p className="py-8 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">Loading</p>
      ) : hasMore ? null : (
        <p className="py-8 text-center text-xs text-zinc-400">—</p>
      )}
    </div>
  );
}
