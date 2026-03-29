/** Paths OAuth may redirect to after `/api/auth/callback` (open-redirect safe). */
const ALLOWED_POST_OAUTH = new Set(["/dashboard", "/admin/verify"]);

/**
 * Returns a safe internal path for the `next` query param on the auth callback.
 */
export function sanitizeOAuthNextParam(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/dashboard";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard";
  const pathOnly = trimmed.split("?")[0].split("#")[0];
  return ALLOWED_POST_OAUTH.has(pathOnly) ? pathOnly : "/dashboard";
}
