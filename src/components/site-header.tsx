"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { useEffect, useRef, useState } from "react";
import AuthButtons from "@/components/auth-buttons";

const MORE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (moreRef.current && !moreRef.current.contains(t)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileMoreOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-black tracking-tight text-zinc-900">
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-700 md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Launchpad
          </Link>
          <Link href="/sell" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Sell
          </Link>
          <Link href="/blog" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Blog
          </Link>
          <Link href="/community" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Community
          </Link>
          <Link href="/leaderboard" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Leaderboard
          </Link>
          <Link href="/pricing" className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900">
            Pricing
          </Link>

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 rounded-lg px-3 py-2 transition hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
              <span className="text-zinc-400" aria-hidden>
                ▾
              </span>
            </button>
            {moreOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-900/5"
                role="menu"
              >
                {MORE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <AuthButtons />
        </div>

        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold md:hidden"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm font-medium text-zinc-700 sm:px-6">
            <Link href="/" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Launchpad
            </Link>
            <Link href="/sell" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Sell
            </Link>
            <Link href="/blog" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Blog
            </Link>
            <Link href="/community" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Community
            </Link>
            <Link href="/leaderboard" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Leaderboard
            </Link>
            <Link href="/pricing" className="rounded-lg px-3 py-2 hover:bg-zinc-50" onClick={closeMobile}>
              Pricing
            </Link>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-zinc-50"
              onClick={() => setMobileMoreOpen((v) => !v)}
            >
              More
              <span className="text-zinc-400">{mobileMoreOpen ? "▴" : "▾"}</span>
            </button>
            {mobileMoreOpen ? (
              <div className="ml-2 flex flex-col border-l border-zinc-200 pl-3">
                {MORE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg py-2 text-sm text-zinc-600 hover:text-zinc-900"
                    onClick={closeMobile}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="border-t border-zinc-100 pt-3">
              <AuthButtons />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
