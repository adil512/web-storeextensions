"use client";

import { useCallback, useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-700 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm transition hover:border-orange-200 hover:bg-orange-50/90 hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 sm:bottom-8 sm:right-8"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
