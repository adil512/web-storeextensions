import Link from "next/link";
import { categoryHref } from "@/lib/category-slugs";
import { SITE_NAME } from "@/lib/brand";
import { CATEGORIES } from "@/lib/constants/listing";

const FOOTER_PLATFORM = [
  { href: "/submit", label: "Submit extension" },
  { href: "/extension-tools", label: "Extension tools" },
  { href: "/auth", label: "Log in / Sign up" },
];

const FOOTER_COMPANY = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/community", label: "Community" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Pricing" },
];

const FOOTER_LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50 text-zinc-700">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="text-xl font-black tracking-tight text-zinc-900">
              {SITE_NAME}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-600">
              A curated browser extension directory for Chrome, Firefox, and Edge. Discover top extensions by category,
              explore developer profiles, and submit your extension to reach more users.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
              >
                Get started
              </Link>
              <Link
                href="/#faq"
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-orange-200 hover:text-orange-800"
              >
                FAQ
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Categories</h3>
              <ul className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2">
                {CATEGORIES.map((c) => (
                  <li key={c} className="mb-2 break-inside-avoid">
                    <Link href={categoryHref(c)} className="text-zinc-600 transition hover:text-orange-700">
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Platform</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {FOOTER_PLATFORM.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-zinc-600 transition hover:text-orange-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {FOOTER_COMPANY.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-zinc-600 transition hover:text-orange-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
            {FOOTER_LEGAL.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-zinc-800">
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-zinc-500">© 2026. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
