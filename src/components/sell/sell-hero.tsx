"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "browse" | "list";

export function SellHero() {
  const [mode, setMode] = useState<Mode>("browse");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const sync = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
    };
    void sync();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void sync());
    return () => sub.subscription.unsubscribe();
  }, []);

  const listHref = loggedIn ? "/dashboard" : "/auth";

  return (
    <section className="relative isolate overflow-hidden border-b border-orange-200/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 text-white">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold leading-snug text-orange-200/95 sm:text-xs sm:px-4">
          #1 Browser Extension Selling & Buying Marketplace
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          Marketplace to Buy and Sell Chrome Extensions Securely
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          Buy and sell Chrome extensions in a verified marketplace with secure listings and trusted transactions.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-2xl border border-white/15 bg-zinc-950/40 p-1 shadow-lg shadow-black/30 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode("browse")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                mode === "browse" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-200 hover:text-white"
              }`}
            >
              Browse for sale
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                mode === "list" ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md shadow-orange-900/40" : "text-zinc-200 hover:text-white"
              }`}
            >
              List your extension
            </button>
          </div>

          {mode === "browse" ? (
            <a
              href="#marketplace-grid"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/10"
            >
              View listings
            </a>
          ) : (
            <Link
              href={listHref}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-lg shadow-black/20 transition hover:bg-zinc-100"
            >
              {loggedIn === false ? "Sign in to manage listings" : loggedIn ? "Open dashboard" : "Checking session…"}
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              k: "Ownership Transparency",
              v: "Clear seller identity, extension details, and asset breakdown so buyers know exactly what they’re acquiring.",
            },
            {
              k: "Real Performance Data",
              v: "Accurate metrics including installs, ratings, and usage trends — no fake numbers or inflated claims.",
            },
            {
              k: "Buyer–Seller Matching",
              v: "Connect with serious buyers and sellers actively looking to acquire or exit Chrome extensions.",
            },
            {
              k: "Market Validation",
              v: "Community signals and interest indicators highlight extensions with real demand and value.",
            },
          ].map((item) => (
            <div key={item.k} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-200/90">{item.k}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
