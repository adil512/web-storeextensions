"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  listingId: string;
};

export function ListingInquiryForm({ listingId }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [message, setMessage] = useState("");
  const [offerHint, setOfferHint] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
    };
    void run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void run());
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await fetch(`/api/listings/${listingId}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, offerHint }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.status === 409 && typeof data.inquiryId === "string") {
      router.push(`/dashboard/inquiries/${data.inquiryId}`);
      return;
    }
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not send inquiry.");
      return;
    }
    if (typeof data.inquiryId === "string") {
      router.push(`/dashboard/inquiries/${data.inquiryId}`);
    }
  };

  if (loggedIn === false) {
    return (
      <div className="rounded-xl border border-emerald-200/80 bg-white/90 px-4 py-4 text-sm text-emerald-950 shadow-sm">
        <p className="font-semibold">Sign in to send a private inquiry</p>
        <p className="mt-1 text-xs text-emerald-900/85">We route messages between you and the seller in your dashboard.</p>
        <Link
          href="/auth"
          className="mt-3 inline-flex rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-emerald-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loggedIn === null) {
    return <p className="text-xs text-emerald-800/80">Checking session…</p>;
  }

  return (
    <form id="listing-inquiry" onSubmit={(ev) => void onSubmit(ev)} className="space-y-3 rounded-xl border border-emerald-200/80 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Private inquiry</p>
      <div>
        <label className="text-xs font-medium text-emerald-950">Message (min 10 characters)</label>
        <textarea
          required
          minLength={10}
          maxLength={8000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Introduce yourself, your interest, and any key questions."
          className="mt-1 w-full rounded-lg border border-emerald-200/80 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-emerald-950">Offer or budget hint (optional)</label>
        <input
          type="text"
          maxLength={500}
          value={offerHint}
          onChange={(e) => setOfferHint(e.target.value)}
          placeholder="e.g. $X–$Y range or structure preference"
          className="mt-1 w-full rounded-lg border border-emerald-200/80 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/15 transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send inquiry"}
      </button>
      <p className="text-[11px] leading-relaxed text-emerald-900/75">
        You can continue the conversation in <Link href="/dashboard/inquiries" className="font-semibold underline">Dashboard → Inquiries</Link>.
      </p>
    </form>
  );
}
