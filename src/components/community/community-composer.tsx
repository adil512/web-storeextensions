"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { COMMUNITY_MAX_LINKS } from "@/lib/community";

export function CommunityComposer({
  isLoggedIn,
  postedTodayUtc,
}: {
  isLoggedIn: boolean;
  postedTodayUtc: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [linkInputs, setLinkInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const addLinkRow = useCallback(() => {
    setLinkInputs((rows) => (rows.length >= COMMUNITY_MAX_LINKS ? rows : [...rows, ""]));
  }, []);

  const setLink = useCallback((i: number, v: string) => {
    setLinkInputs((rows) => rows.map((x, j) => (j === i ? v : x)));
  }, []);

  const removeLinkRow = useCallback((i: number) => {
    setLinkInputs((rows) => rows.filter((_, j) => j !== i));
  }, []);

  const submit = async () => {
    setMsg("");
    const trimmed = body.trim();
    if (!trimmed) {
      setMsg("Post cannot be empty.");
      return;
    }
    const links = linkInputs.map((s) => s.trim()).filter(Boolean);
    setLoading(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed, links }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Could not publish.");
      return;
    }
    setBody("");
    setLinkInputs([""]);
    router.refresh();
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-24px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-zinc-600">Sign in to publish.</p>
        <Link
          href="/auth"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (postedTodayUtc) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-5 py-4 text-sm text-zinc-700 sm:px-6 sm:py-5">
        <p className="font-medium text-zinc-900">Daily limit reached</p>
        <p className="mt-1 text-zinc-600">One post per UTC day.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-24px_rgba(0,0,0,0.12)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Compose</h2>
        <span className="text-xs tabular-nums text-zinc-400">{body.length} / 12,000</span>
      </div>

      <div className="space-y-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={12000}
          placeholder="Write your post…"
          className="w-full resize-y rounded-xl border-0 bg-zinc-50/80 px-4 py-3 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none ring-1 ring-zinc-200/80 transition focus:bg-white focus:ring-2 focus:ring-orange-500/25"
        />

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">Links · max {COMMUNITY_MAX_LINKS}</p>
          {linkInputs.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={row}
                onChange={(e) => setLink(i, e.target.value)}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono text-zinc-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              />
              {linkInputs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeLinkRow(i)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          {linkInputs.length < COMMUNITY_MAX_LINKS ? (
            <button
              type="button"
              onClick={addLinkRow}
              className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-orange-600 hover:underline"
            >
              Add link
            </button>
          ) : null}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void submit()}
          className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 py-3 text-sm font-medium text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 sm:w-auto sm:min-w-[8rem] sm:px-8"
        >
          {loading ? "Publishing…" : "Publish"}
        </button>
        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
      </div>
    </div>
  );
}
