"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CommunityCommentRow, CommunityPostFeedRow } from "@/lib/community";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function displayName(row: CommunityPostFeedRow) {
  if (row.full_name?.trim()) return row.full_name.trim();
  if (row.username) return `@${row.username}`;
  return "Member";
}

export function CommunityPostCard({
  post,
  currentUserId,
  isLoggedIn,
  onCommentPosted,
}: {
  post: CommunityPostFeedRow;
  currentUserId: string | null;
  isLoggedIn: boolean;
  onCommentPosted: (postId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommunityCommentRow[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState("");

  const links = Array.isArray(post.links) ? (post.links as unknown[]).filter((x): x is string => typeof x === "string") : [];

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    const res = await fetch(`/api/community/posts/${post.id}/comments`);
    const data = await res.json();
    setLoadingComments(false);
    if (!res.ok) {
      setComments([]);
      return;
    }
    setComments(data.comments as CommunityCommentRow[]);
  }, [post.id]);

  useEffect(() => {
    if (open && comments === null) void loadComments();
  }, [open, comments, loadComments]);

  const submitComment = async () => {
    const t = commentBody.trim();
    if (!t) return;
    setPosting(true);
    setMsg("");
    const res = await fetch(`/api/community/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: t }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Could not comment.");
      return;
    }
    setCommentBody("");
    onCommentPosted(post.id);
    void loadComments();
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-24px_rgba(0,0,0,0.12)]">
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {post.username ? (
              <Link href={`/u/${post.username}`} className="text-[15px] font-medium text-zinc-900 hover:text-orange-600">
                {displayName(post)}
              </Link>
            ) : (
              <span className="text-[15px] font-medium text-zinc-900">{displayName(post)}</span>
            )}
            <p className="mt-1 text-xs tabular-nums text-zinc-400">{formatWhen(post.created_at)}</p>
          </div>
          {currentUserId === post.author_id ? (
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              You
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">{post.body}</p>

        {links.length > 0 ? (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">Links</p>
            <ul className="mt-2 space-y-1.5">
              {links.map((href) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {href}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500 transition hover:text-orange-600"
        >
          {open ? "Close" : (
            <>
              Comments <span className="tabular-nums text-zinc-400">· {post.comment_count}</span>
            </>
          )}
        </button>

        {open ? (
          <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-4">
            {loadingComments ? (
              <p className="text-xs text-zinc-400">Loading</p>
            ) : comments && comments.length === 0 ? (
              <p className="text-xs text-zinc-400">No comments</p>
            ) : (
              <ul className="space-y-3">
                {(comments ?? []).map((c) => (
                  <li key={c.id} className="rounded-lg border border-zinc-100 bg-white px-3 py-2.5">
                    <p className="text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-700">{c.username ? `@${c.username}` : "Member"}</span>
                      <span className="mx-1.5">·</span>
                      {formatWhen(c.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            {isLoggedIn ? (
              <div className="mt-4 border-t border-zinc-200/80 pt-4">
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">Reply</label>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                  maxLength={4000}
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="…"
                />
                <button
                  type="button"
                  disabled={posting}
                  onClick={() => void submitComment()}
                  className="mt-2 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                >
                  {posting ? "Sending…" : "Send"}
                </button>
                {msg ? <p className="mt-2 text-sm text-red-600">{msg}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-500">
                <Link href="/auth" className="font-medium text-orange-600 hover:text-orange-700">
                  Sign in
                </Link>{" "}
                to reply.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
