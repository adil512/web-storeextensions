import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, XIcon } from "@/components/pricing/check-icon";
import { SITE_NAME } from "@/lib/brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Extension Pricing – Submit & Promote Your Browser Extensions",
  description:
    "Explore flexible pricing plans to submit and promote your browser extensions. List for free or boost visibility with featured placements, priority review, and lifetime listings for Chrome, Firefox, and Edge.",
  alternates: { canonical: canonicalUrl("/pricing") },
};

const faqs = [
  {
    q: "What does “featured” mean?",
    a: "Featured listings appear in the homepage carousel and get stronger visibility across the directory. Free submissions are live when approved but are not placed in that carousel.",
  },
  {
    q: "How does the free tier work?",
    a: "You submit like everyone else and go through moderation. There is no charge. To keep the directory healthy, we may archive or remove older free listings after some time if we need space—always subject to our terms and editorial standards.",
  },
  {
    q: "What do I get for $10?",
    a: "You get a faster, prioritized review path and featured placement on the homepage for a multi-month window (exact duration is confirmed at checkout). Ideal when you want visibility soon without a long-term commitment.",
  },
  {
    q: "What does the $40 lifetime plan include?",
    a: "It is meant for makers who want a long-term home on the directory: extended featured eligibility and a listing we treat as durable, except where removal is required for policy, legal, or safety reasons.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Start free or on the boost tier and move up when you are ready. Contact us if you already have a live listing and want to change plans.",
  },
  {
    q: "How do payments work?",
    a: "Secure checkout is connected in phases. After you sign in and submit, we will guide you through payment for paid tiers. Until then, use the same flow to submit and we will follow up if needed.",
  },
  {
    q: "Do you offer refunds?",
    a: "If a paid listing cannot be delivered as described—for example, we cannot approve the extension under our rules—we will work with you on a fair resolution. See Terms for details.",
  },
  {
    q: "Why might an admin remove a listing?",
    a: "Reasons include policy violations, duplicate or misleading entries, security concerns, or routine cleanup on the free tier. Paid tiers are protected by the terms of the plan you choose.",
  },
];

export default async function PricingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? "/submit" : "/auth";
  const ctaLabel = user ? "Submit listing" : "Sign in to submit";

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-gradient-to-b from-white via-orange-50/30 to-zinc-50">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700/90">Listing plans</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl sm:leading-[1.1]">
            Publish your extension on {SITE_NAME}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Choose how you want to launch—from free community review to featured placement and long-term visibility.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
            >
              {ctaLabel}
            </Link>
            <a
              href="#plans"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white/80 px-6 py-3 text-sm font-semibold text-zinc-800 backdrop-blur-sm transition hover:border-zinc-400 hover:bg-white"
            >
              Compare plans
            </a>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Free */}
          <article className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_16px_48px_-28px_rgba(0,0,0,0.15)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Starter</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-900">Free</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-zinc-950">$0</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">Community queue, no featured carousel.</p>
            <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-zinc-700">
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Full submission form & moderation review</span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Public listing when approved</span>
              </li>
              <li className="flex gap-2.5">
                <XIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
                <span className="text-zinc-500">Homepage featured carousel</span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <span>May be rotated or removed after time (admin discretion)</span>
              </li>
            </ul>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-orange-400 hover:bg-orange-50/60 hover:text-orange-950"
            >
              {user ? "Submit free" : "Sign in — submit free"}
            </Link>
          </article>

          {/* Boost $10 */}
          <article className="relative flex flex-col rounded-2xl border-2 border-orange-400/80 bg-gradient-to-b from-white to-orange-50/40 p-6 shadow-[0_20px_60px_-24px_rgba(234,88,12,0.35)] sm:p-8 lg:-mt-2 lg:mb-2 lg:scale-[1.02]">
            <span className="absolute right-5 top-5 rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Popular
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-800/80">Boost</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-900">Featured + quick launch</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-zinc-950">$6</span>
              <span className="text-sm text-zinc-500">one-time</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">Priority review, featured for months.</p>
            <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-zinc-800">
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>
                  <strong className="font-semibold text-zinc-900">Faster review</strong> — jump the standard queue
                </span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>
                  <strong className="font-semibold text-zinc-900">Homepage featured</strong> for a multi-month window
                </span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>Ideal for launches, updates, and campaigns</span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>Listing stays published for the plan term</span>
              </li>
            </ul>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:from-orange-600 hover:to-orange-700"
            >
              {user ? "Get boost — submit" : "Sign in — get boost"}
            </Link>
          </article>

          {/* Lifetime $40 */}
          <article className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_16px_48px_-28px_rgba(0,0,0,0.15)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pro</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-900">Lifetime + featured</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-zinc-950">$40</span>
              <span className="text-sm text-zinc-500">one-time</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">Long-term presence and top placement.</p>
            <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-zinc-700">
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <span>
                  <strong className="font-semibold text-zinc-900">Lifetime listing</strong> (except policy / legal removal)
                </span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <span>
                  <strong className="font-semibold text-zinc-900">Featured eligibility</strong> on an ongoing basis
                </span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <span>Highest review priority</span>
              </li>
              <li className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <span>Best for serious products and portfolios</span>
              </li>
            </ul>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-violet-600 to-violet-700 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:from-violet-700 hover:to-violet-800"
            >
              {user ? "Get lifetime — submit" : "Sign in — get lifetime"}
            </Link>
          </article>
        </div>

        {/* Highlights strip */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Moderated directory", d: "Every listing is reviewed for quality and safety." },
            { t: "Chrome & browser focus", d: "Built for extension makers and discovery." },
            { t: "Transparent tiers", d: "Know what featured and tenure mean up front." },
          ].map((item) => (
            <div
              key={item.t}
              className="rounded-xl border border-zinc-200/80 bg-white/90 px-5 py-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-zinc-900">{item.t}</p>
              <p className="mt-1 text-sm text-zinc-600">{item.d}</p>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="mt-16">
          <h2 className="text-center text-lg font-semibold text-zinc-900 sm:text-xl">At a glance</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-zinc-600">
            Side-by-side summary. Final terms are confirmed at checkout.
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90">
                  <th className="px-4 py-3 font-semibold text-zinc-900 sm:px-6">Feature</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 sm:px-6">Free</th>
                  <th className="px-4 py-3 font-semibold text-orange-800 sm:px-6">$10 boost</th>
                  <th className="px-4 py-3 font-semibold text-zinc-900 sm:px-6">$40 lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">Homepage featured</td>
                  <td className="px-4 py-3 sm:px-6">—</td>
                  <td className="px-4 py-3 text-orange-800 sm:px-6">Yes (months)</td>
                  <td className="px-4 py-3 sm:px-6">Yes (ongoing)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">Review speed</td>
                  <td className="px-4 py-3 sm:px-6">Standard</td>
                  <td className="px-4 py-3 text-orange-800 sm:px-6">Priority</td>
                  <td className="px-4 py-3 sm:px-6">Highest</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">Listing tenure</td>
                  <td className="px-4 py-3 sm:px-6">May rotate</td>
                  <td className="px-4 py-3 text-orange-800 sm:px-6">Plan window</td>
                  <td className="px-4 py-3 sm:px-6">Lifetime*</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">Price</td>
                  <td className="px-4 py-3 sm:px-6">$0</td>
                  <td className="px-4 py-3 font-semibold text-orange-800 sm:px-6">$10</td>
                  <td className="px-4 py-3 font-semibold sm:px-6">$40</td>
                </tr>
              </tbody>
            </table>
            <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 sm:px-6">
              *Lifetime means we intend to keep your listing indefinitely except for violations of our terms, law, or security
              issues.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h4 className="text-center text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">FAQ</h4>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
            Everything you need to pick a plan. Still unsure?{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-700">
              Contact
            </Link>
            .
          </p>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-1 transition hover:border-zinc-300 open:border-orange-200/80 open:bg-orange-50/20 sm:px-5"
              >
                <summary className="cursor-pointer list-none py-3 text-sm font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <svg
                      className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="border-t border-zinc-200/80 pb-4 pt-2 text-sm leading-relaxed text-zinc-600 group-open:border-orange-100">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
