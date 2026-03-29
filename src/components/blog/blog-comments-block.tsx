import Link from "next/link";
import { BlogCommentForm } from "@/components/blog/blog-comment-form";

export type ApprovedBlogComment = {
  id: string;
  author_name: string;
  body: string;
  website_url: string | null;
  created_at: string;
};

function formatCommentDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BlogCommentsBlock({
  blogPostId,
  comments,
}: {
  blogPostId: string;
  comments: ApprovedBlogComment[];
}) {
  return (
    <section className="mt-12 border-t border-zinc-200 pt-12" aria-labelledby="blog-comments-heading">
      <h2 id="blog-comments-heading" className="text-xl font-black tracking-tight text-zinc-950">
        Comments
      </h2>
      <p className="mt-2 text-sm text-zinc-600">Thoughts or questions? Comments are reviewed before they appear.</p>

      {comments.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-zinc-200/90 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-bold text-zinc-900">{c.author_name}</span>
                {c.website_url ? (
                  <Link
                    href={c.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-orange-600 underline decoration-orange-200 underline-offset-2 hover:text-orange-700"
                  >
                    Website
                  </Link>
                ) : null}
                <time dateTime={c.created_at} className="text-xs font-medium text-zinc-400">
                  {formatCommentDate(c.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">No comments yet — be the first to share your take.</p>
      )}

      <div className="mt-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Leave a comment</h3>
        <div className="mt-4">
          <BlogCommentForm blogPostId={blogPostId} />
        </div>
      </div>
    </section>
  );
}
