"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  listingId: string;
  slug: string;
  initialListedForSale: boolean;
  initialCurrentUsers: number | null;
  initialPrimaryCountry: string | null;
};

export function ApprovedMarketplacePanel({
  listingId,
  slug,
  initialListedForSale,
  initialCurrentUsers,
  initialPrimaryCountry,
}: Props) {
  const [listedForSale, setListedForSale] = useState(initialListedForSale);
  const [activeUsers, setActiveUsers] = useState(
    initialCurrentUsers != null && Number.isFinite(Number(initialCurrentUsers)) ? String(initialCurrentUsers) : ""
  );
  const [primaryCountry, setPrimaryCountry] = useState(initialPrimaryCountry ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<"toggle" | "metrics" | null>(null);

  async function patch(body: object) {
    const res = await fetch(`/api/extensions/${listingId}/marketplace`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed.");
  }

  async function saveToggle(next: boolean) {
    setSaving("toggle");
    setMessage(null);
    try {
      await patch({ listedForSale: next });
      setListedForSale(next);
      setMessage(next ? "Now visible on the Sell marketplace." : "Removed from the Sell marketplace.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update marketplace flag.");
    } finally {
      setSaving(null);
    }
  }

  async function saveMetrics() {
    setSaving("metrics");
    setMessage(null);
    const n = activeUsers.trim() === "" ? 0 : Number(activeUsers);
    if (Number.isNaN(n) || n < 0) {
      setMessage("Enter a valid non‑negative number for active installations.");
      setSaving(null);
      return;
    }
    try {
      await patch({ currentUsers: n, primaryCountry: primaryCountry.trim() });
      setMessage("Marketplace stats saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save stats.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/90 to-amber-50/40 p-4 shadow-inner sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-orange-900">Sell marketplace</h3>
          <p className="mt-1 max-w-xl text-xs text-orange-900/80">
            Opt in to surface this extension on{" "}
            <Link href="/sell" className="font-semibold underline hover:text-orange-950">
              /sell
            </Link>
            . Launchpad and category pages stay the same either way. Buyers reach you via your{" "}
            <Link href="/account" className="font-semibold underline hover:text-orange-950">
              public profile
            </Link>{" "}
            (set a username plus website or social links), through listing comments, or the private inquiry form on your public
            page (buyers see it in Dashboard → Inquiries).
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-200/80 bg-white/80 px-3 py-2 shadow-sm">
          <input
            type="checkbox"
            checked={listedForSale}
            disabled={saving !== null}
            onChange={(e) => void saveToggle(e.target.checked)}
            className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm font-semibold text-zinc-900">List on marketplace</span>
        </label>
      </div>

      <div className="mt-4 grid gap-4 border-t border-orange-100/80 pt-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-orange-900/90">
            Reported installs (active users)
          </label>
          <input
            type="number"
            min={0}
            value={activeUsers}
            disabled={saving !== null}
            onChange={(e) => setActiveUsers(e.target.value)}
            placeholder="e.g. 12500"
            className="mt-1 w-full rounded-xl border border-orange-200/80 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-orange-900/90">
            Primary geography (country)
          </label>
          <input
            type="text"
            value={primaryCountry}
            disabled={saving !== null}
            onChange={(e) => setPrimaryCountry(e.target.value)}
            placeholder="e.g. United States"
            className="mt-1 w-full rounded-xl border border-orange-200/80 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void saveMetrics()}
          className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-orange-900/20 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
        >
          {saving === "metrics" ? "Saving…" : "Save marketplace stats"}
        </button>
        <Link href={`/extensions/${slug}`} className="text-xs font-semibold text-orange-900 underline hover:text-orange-950">
          View public page
        </Link>
      </div>

      {message ? <p className="mt-3 text-xs text-zinc-800">{message}</p> : null}
    </div>
  );
}
