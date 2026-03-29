import { extensionListingHref } from "@/lib/listing-slug";

const DEFAULT_ADMIN_EMAIL = "fachoadilbalti@gmail.com";

type NewSubmissionPayload = {
  listingName: string;
  extensionId: string;
  submitterEmail?: string;
  listingId: string;
  /** Empty if slug column missing or allocation skipped. */
  listingSlug?: string | null;
  appUrl: string;
  featuredPlacementRequested?: boolean;
};

/**
 * Sends email via Resend HTTP API when RESEND_API_KEY is set.
 * Set ADMIN_NOTIFY_EMAIL to override recipient (defaults to project owner email).
 */
export async function notifyAdminNewSubmission(payload: NewSubmissionPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL || DEFAULT_ADMIN_EMAIL;
  const from =
    process.env.RESEND_FROM || "Web Store Extensions <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      "[notify-admin] RESEND_API_KEY not set — skipping new submission email. Add it to .env.local to enable.",
    );
    return;
  }

  const origin = payload.appUrl.replace(/\/$/, "");
  const detailUrl = `${origin}/admin?tab=queue`;
  const publicUrl = `${origin}${extensionListingHref({ id: payload.listingId, slug: payload.listingSlug })}`;

  const html = `
    <h2>New extension submission</h2>
    <p><strong>${escapeHtml(payload.listingName)}</strong></p>
    <p>Extension ID: <code>${escapeHtml(payload.extensionId)}</code></p>
    <p>Listing ID: <code>${escapeHtml(payload.listingId)}</code></p>
    ${payload.submitterEmail ? `<p>Submitter: ${escapeHtml(payload.submitterEmail)}</p>` : ""}
    ${
      payload.featuredPlacementRequested
        ? "<p><strong>Featured placement requested</strong> — verify payment (see Pricing), then approve and set featured order in admin.</p>"
        : ""
    }
    <p>Public URL (after approval): <a href="${escapeHtml(publicUrl)}">${escapeHtml(publicUrl)}</a></p>
    <p><a href="${detailUrl}">Open admin queue</a></p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New submission: ${payload.listingName.slice(0, 80)}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[notify-admin] Resend error:", res.status, text);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
