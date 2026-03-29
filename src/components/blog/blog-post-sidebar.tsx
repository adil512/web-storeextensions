import Link from "next/link";
import type { BlogTocItem } from "@/lib/blog-toc";

/** Sits under the post title in the article header (not in a sidebar). */
export function BlogPostTocUnderHeading({ items }: { items: BlogTocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="mt-8 max-w-4xl rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4 sm:p-5" aria-label="Table of contents">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">On this page</p>
      <ul className="mt-3 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
        {items.map((item, i) => {
          const indent = Math.max(0, item.level - 2);
          return (
            <li key={`toc-h-${i}`} className="break-inside-avoid">
              <a
                href={`#${item.id}`}
                className="block rounded-lg py-1.5 text-sm leading-snug text-zinc-600 transition hover:bg-white/80 hover:text-orange-700"
                style={{ paddingLeft: `${0.75 + indent * 0.75}rem` }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const exploreLinks = [
  { href: "/submit", title: "Submit extension", description: "List your Chrome or Firefox extension" },
  { href: "/", title: "Browse directory", description: "Discover extensions by category" },
  { href: "/extension-tools", title: "Extension tools", description: "Resources for builders and makers" },
  { href: "/blog", title: "All blog posts", description: "Guides and product updates" },
] as const;

export function BlogPostExploreAside() {
  return (
    <aside className="rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-5 shadow-sm" aria-label="Site links">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Explore</p>
      <ul className="mt-4 space-y-4">
        {exploreLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group block rounded-xl p-2 -m-2 transition hover:bg-white hover:shadow-sm">
              <span className="text-sm font-semibold text-zinc-900 group-hover:text-orange-700">{link.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
