"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ListingCommentForm({ listingId }: { listingId: string }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  if (!userId) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/auth" className="font-semibold text-orange-600 hover:text-orange-700">
          Sign in
        </Link>{" "}
        to leave a comment.
      </p>
    );
  }

  const submit = async () => {
    const text = body.trim();
    if (!text) {
      setMsg("Write something first.");
      return;
    }
    setLoading(true);
    setMsg("");
    const { error } = await supabase.from("listing_comments").insert({
      listing_id: listingId,
      user_id: userId,
      body: text,
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setBody("");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add a comment</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={8000}
        placeholder="Share feedback or tips for other users…"
        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void submit()}
          className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post comment"}
        </button>
        <span className="text-xs text-zinc-500">{body.length}/8000</span>
      </div>
      {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
    </div>
  );
}
