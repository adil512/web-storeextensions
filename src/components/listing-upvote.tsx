"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function UpTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 5.5L20 18H4l8-12.5z" />
    </svg>
  );
}

export function ListingUpvote({
  listingId,
  initialCount,
  compact = false,
}: {
  listingId: string;
  initialCount: number;
  compact?: boolean;
}) {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const loadVoteState = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setHasVoted(false);
      return;
    }
    const { data } = await supabase
      .from("listing_upvotes")
      .select("listing_id")
      .eq("listing_id", listingId)
      .eq("user_id", uid)
      .maybeSingle();
    setHasVoted(!!data);
  }, [supabase, listingId]);

  useEffect(() => {
    void loadVoteState();
  }, [loadVoteState]);

  const toggle = async () => {
    if (!userId) return;
    setLoading(true);
    setMsg("");
    if (hasVoted) {
      const { error } = await supabase
        .from("listing_upvotes")
        .delete()
        .eq("listing_id", listingId)
        .eq("user_id", userId);
      setLoading(false);
      if (error) {
        setMsg(error.message);
        return;
      }
      setHasVoted(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase.from("listing_upvotes").insert({ listing_id: listingId, user_id: userId });
      setLoading(false);
      if (error) {
        setMsg(error.message);
        return;
      }
      setHasVoted(true);
      setCount((c) => c + 1);
    }
  };

  const countPublic = (
    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50/90 px-3 py-1.5">
      <UpTriangle className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
      <span className="text-sm text-zinc-700">
        <span className="font-semibold tabular-nums text-zinc-900">{count.toLocaleString("en-US")}</span>
        <span className="text-zinc-600"> upvote{count === 1 ? "" : "s"}</span>
      </span>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {countPublic}
        <p className="text-[11px] leading-snug text-zinc-500">Visible to everyone. Sign in to add your vote.</p>
        <div className="flex flex-wrap items-center gap-2">
          {userId ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void toggle()}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                hasVoted
                  ? "bg-orange-600 text-white shadow-sm"
                  : "border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100"
              }`}
            >
              {hasVoted ? "Upvoted" : "Upvote"}
            </button>
          ) : (
            <Link href="/auth" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              Sign in to upvote
            </Link>
          )}
          {msg ? <span className="text-xs text-red-600">{msg}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.04] sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Community upvotes</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900">
              {count.toLocaleString("en-US")}
            </span>
            <span className="text-sm font-medium text-zinc-500">upvote{count === 1 ? "" : "s"} (public)</span>
          </p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
            Total is visible to all visitors. Only signed-in accounts can add or remove a vote.
          </p>
        </div>
        {userId ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void toggle()}
            className={`w-full rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 sm:w-auto ${
              hasVoted
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "border border-orange-300 bg-orange-50 text-orange-950 hover:bg-orange-100"
            }`}
          >
            {loading ? "…" : hasVoted ? "Remove your upvote" : "Upvote"}
          </button>
        ) : (
          <Link
            href="/auth"
            className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 sm:w-auto"
          >
            Sign in to upvote
          </Link>
        )}
      </div>
      {msg ? <p className="mt-3 text-sm text-red-600">{msg}</p> : null}
    </div>
  );
}
