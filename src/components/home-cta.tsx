import Link from "next/link";

export default function HomeCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300/90">Ready to ship</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            List your extension and reach real users today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Sign in to submit your product, build your maker profile, and get reviewed for the public directory.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth"
              className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-8 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:from-orange-600 hover:to-orange-700"
            >
              Log in or sign up
            </Link>
            <Link
              href="/submit"
              className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-xl border-2 border-orange-400/90 bg-orange-500/10 px-8 text-sm font-semibold text-orange-100 shadow-sm transition hover:border-orange-300 hover:bg-orange-500/20 hover:text-white"
            >
              Submit extension
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
