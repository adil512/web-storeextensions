import type { ReactNode } from "react";

export function ContentPageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" aria-hidden />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function ContentPageMain({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="space-y-10">{children}</div>
    </div>
  );
}

export function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-zinc-100 pb-10 last:border-0 last:pb-0">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{title}</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}
