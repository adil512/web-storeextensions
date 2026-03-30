import type { Metadata } from "next";
import Link from "next/link";
import { TOOL_CATEGORIES, TOOLS, type ToolCategory } from "@/lib/tools-registry";
import { canonicalUrl } from "@/lib/site-url";
import { SITE_NAME } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Extension developer tools · ${SITE_NAME}`,
    description:
      "Free browser extension utilities: manifest helpers, store listing checks, privacy drafts, keyword ideas, and more.",
    alternates: { canonical: await canonicalUrl("/extension-tools") },
  };
}

function categoryTone(cat: ToolCategory): string {
  if (cat === "build") return "border-orange-200/90 bg-orange-50/50 text-orange-900";
  if (cat === "ship") return "border-sky-200/90 bg-sky-50/50 text-sky-950";
  return "border-violet-200/90 bg-violet-50/50 text-violet-950";
}

export default function ExtensionToolsPage() {
  const grouped: Record<ToolCategory, typeof TOOLS> = {
    build: TOOLS.filter((t) => t.category === "build"),
    ship: TOOLS.filter((t) => t.category === "ship"),
    grow: TOOLS.filter((t) => t.category === "grow"),
  };

  return (
    <div className="bg-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-200/90 bg-gradient-to-b from-white via-zinc-50 to-zinc-100/80">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700/85">Free utilities</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Extension maker tools
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Practical helpers for manifests, store assets, compliance drafts, and go-to-market copy. Everything runs in your
            browser—no account required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
            >
              Submit to directory
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Browse listings
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 sm:py-16">
        {(["build", "ship", "grow"] as const).map((cat) => (
          <section key={cat} aria-labelledby={`ext-tools-${cat}`}>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id={`ext-tools-${cat}`} className="text-2xl font-black tracking-tight text-zinc-900">
                  {TOOL_CATEGORIES[cat].label}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{TOOL_CATEGORIES[cat].description}</p>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[cat].map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/extension-tools/${tool.slug}`}
                    className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:-translate-y-0.5 hover:shadow-md ${categoryTone(cat)}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {TOOL_CATEGORIES[cat].label}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-zinc-950">{tool.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{tool.tagline}</p>
                    <span className="mt-4 text-sm font-semibold text-orange-600">Open tool →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
