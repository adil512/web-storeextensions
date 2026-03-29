import Link from "next/link";
import { BLOG_AUTHOR } from "@/lib/blog-author";

export function BlogAuthorCard() {
  return (
    <section className="mt-12 rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50/90 p-6 shadow-sm sm:p-8" aria-labelledby="blog-author-heading">
      <h2 id="blog-author-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        About the author
      </h2>
      <p className="mt-3 text-lg font-bold text-zinc-900">{BLOG_AUTHOR.name}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{BLOG_AUTHOR.bio}</p>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <li>
          <Link href={BLOG_AUTHOR.website} className="text-orange-600 underline decoration-orange-200 underline-offset-2 hover:text-orange-700">
            Website
          </Link>
        </li>
        <li>
          <Link href={BLOG_AUTHOR.twitter} className="text-orange-600 underline decoration-orange-200 underline-offset-2 hover:text-orange-700" rel="noopener noreferrer" target="_blank">
            Twitter
          </Link>
        </li>
        <li>
          <Link href={BLOG_AUTHOR.linkedin} className="text-orange-600 underline decoration-orange-200 underline-offset-2 hover:text-orange-700" rel="noopener noreferrer" target="_blank">
            LinkedIn
          </Link>
        </li>
      </ul>
    </section>
  );
}
