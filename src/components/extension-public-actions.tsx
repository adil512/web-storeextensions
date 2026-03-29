"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ExtensionViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const k = `el_view:${listingId}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(k)) return;
    try {
      sessionStorage.setItem(k, "1");
    } catch {
      /* ignore */
    }
    void fetch(`/api/listings/${listingId}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "view" }),
    });
  }, [listingId]);
  return null;
}

export function TrackedStoreLink({
  listingId,
  href,
  className,
  children,
}: {
  listingId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void fetch(`/api/listings/${listingId}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "store_click" }),
        });
      }}
    >
      {children}
    </a>
  );
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Malware or security concern",
  "Copyright / impersonation",
  "Wrong or duplicate listing",
  "Other",
];

export function ReportListingButton({ listingId }: { listingId: string }) {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then((res: { data: { user: { id: string } | null } }) =>
      setUserId(res.data.user?.id ?? null),
    );
  }, [supabase]);

  if (!userId) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/auth" className="font-semibold text-orange-600 hover:text-orange-700">
          Sign in
        </Link>{" "}
        to report this listing.
      </p>
    );
  }

  const submit = async () => {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/listings/${listingId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "Could not submit report.");
      return;
    }
    setMsg("Thanks — moderators will review this.");
    setOpen(false);
    setDetails("");
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">See something wrong?</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Report listing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-zinc-900">Report to moderators</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Optional details…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg ? <p className="mt-2 text-sm text-emerald-700">{msg}</p> : null}
    </div>
  );
}
