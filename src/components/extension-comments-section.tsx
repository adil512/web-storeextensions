import { ListingCommentForm } from "@/components/listing-comment-form";

export type PublicListingComment = {
  id: string;
  body: string;
  created_at: string;
  username: string | null;
};

function formatCommentWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function ExtensionCommentsSection({
  listingId,
  comments,
}: {
  listingId: string;
  comments: PublicListingComment[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-zinc-900">Comments</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Everyone can read the thread below.{" "}
        <span className="font-medium text-zinc-800">Posting a comment requires signing in.</span>
      </p>

      <div className="mt-5 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-500">No comments yet — be the first.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">{c.username ? `@${c.username}` : "User"}</span>
                  <span className="mx-2">·</span>
                  {formatCommentWhen(c.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-6">
        <ListingCommentForm listingId={listingId} />
      </div>
    </section>
  );
}
