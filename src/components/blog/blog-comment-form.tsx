"use client";

import { useActionState } from "react";
import { submitBlogComment, type BlogCommentFormState } from "@/app/blog/actions";

const initial: BlogCommentFormState = { ok: false };

const inputClass =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20";

export function BlogCommentForm({ blogPostId }: { blogPostId: string }) {
  const [state, formAction, pending] = useActionState(submitBlogComment, initial);

  if (state.ok) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">
        Thanks — your comment was submitted and will appear after a quick review.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="blog_post_id" value={blogPostId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="blog-comment-name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Name
          </label>
          <input id="blog-comment-name" name="author_name" type="text" required maxLength={200} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="blog-comment-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Email
          </label>
          <input
            id="blog-comment-email"
            name="author_email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">Not shown publicly. Used for moderation only.</p>
        </div>
      </div>

      <div>
        <label htmlFor="blog-comment-website" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Website <span className="font-normal normal-case text-zinc-400">(optional)</span>
        </label>
        <input id="blog-comment-website" name="website_url" type="url" maxLength={500} placeholder="https://" className={inputClass} />
      </div>

      <div>
        <label htmlFor="blog-comment-body" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Comment
        </label>
        <textarea id="blog-comment-body" name="body" required rows={5} maxLength={8000} className={`${inputClass} resize-y min-h-[120px]`} />
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Post comment"}
      </button>
    </form>
  );
}
