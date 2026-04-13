import Link from "next/link";

const PLATFORMS = [
  {
    name: "Product Hunt",
    description: "Discover launches and community feedback for Web Store Extensions.",
    href: "https://www.producthunt.com/products/web-store-extensions",
    accent: "from-orange-500/90 to-amber-500/90",
    ring: "ring-orange-200/80",
    badge: "PH",
  },
  {
    name: "Trustpilot",
    description: "Independent reviews from builders and users who use our directory.",
    href: "https://www.trustpilot.com/review/webstoreextensions.com",
    accent: "from-emerald-500/90 to-teal-600/90",
    ring: "ring-emerald-200/80",
    badge: "★",
  },
  {
    name: "SaaSHub",
    description: "Featured on SaaSHub as Web Store Extensions.",
    href: "https://www.saashub.com/web-store-extensions",
    accent: "from-sky-500/90 to-indigo-500/90",
    ring: "ring-sky-200/80",
    badge: "SH",
  },
] as const;

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default function TrustedPlatformsSection() {
  return (
    <section
      className="relative border-t border-zinc-200/90 bg-gradient-to-b from-zinc-100/80 via-white to-zinc-50/90"
      aria-labelledby="trusted-platforms-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="trusted-platforms-heading"
            className="mt-3 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl"
          >
            We Are Featured
          </h2>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-28px_rgba(0,0,0,0.18)] ring-1 ${p.ring} transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${p.accent} text-sm font-black text-white shadow-md`}
                    aria-hidden
                  >
                    {p.badge}
                  </span>
                  <ExternalIcon className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-orange-500" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                  View profile
                  <span className="translate-x-0 transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
