"use client";

import { deleteBlogComment } from "@/app/admin/actions";

export function AdminBlogCommentDeleteForm({ commentId }: { commentId: string }) {
  return (
    <form
      action={deleteBlogComment}
      onSubmit={(e) => {
        if (!window.confirm("Delete this comment permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={commentId} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 shadow-sm hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
