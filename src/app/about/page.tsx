import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About Us – Browser Extension Marketplace & Community",
    description:
      "Learn about our browser extension marketplace where developers submit, list, and promote extensions for Chrome, Firefox, and Edge. Discover our mission to help users find the best tools and creators grow.",
    alternates: { canonical: await canonicalUrl("/about") },
  };
}

export default function AboutPage() {
  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-200/90 bg-gradient-to-b from-white via-zinc-50 to-zinc-100/80">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700/90">About us</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Building a trusted home for browser extensions
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            {SITE_NAME} helps makers launch and grow while helping users discover high-quality extensions they can trust.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900">What we do</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              We run a curated extension directory where makers submit listings and users browse trusted tools by category,
              profile, and marketplace views. Featured and premium options are available on{" "}
              <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
                Pricing
              </Link>
              .
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900">How moderation works</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Every listing is reviewed for quality, clarity, and policy compliance. We may approve, request edits, or
              reject submissions that do not meet platform standards.
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900">Community and growth</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Makers can engage in{" "}
              <Link href="/community" className="font-medium text-orange-600 hover:text-orange-700">
                Community
              </Link>
              , collect social proof through upvotes, and connect with buyers through our marketplace and inquiry flows.
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="relative h-64 w-full bg-zinc-100 sm:h-80">
              <Image
                src="/our-team.webp"
                alt="Our team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 70vw"
                priority
              />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-zinc-900">Our team</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                We are a product-focused team helping extension creators get discovered and helping users find reliable tools
                faster. We continuously improve listings, trust signals, and marketplace quality.
              </p>
            </div>
          </article>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900">Work with us</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Ready to publish your extension and reach more users?
            </p>
            <div className="mt-5 space-y-3">
              <Link
                href="/submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
              >
                Submit your extension
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                Contact our team
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
