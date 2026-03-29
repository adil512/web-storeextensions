export const COMMUNITY_MAX_LINKS = 10;
export const COMMUNITY_INITIAL_PAGE_SIZE = 100;
export const COMMUNITY_LOAD_MORE_SIZE = 50;

export type CommunityPostFeedRow = {
  id: string;
  author_id: string;
  body: string;
  links: unknown;
  comment_count: number;
  created_at: string;
  username: string | null;
  full_name: string | null;
};

export type CommunityCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  username: string | null;
};

function toBase64Url(json: string): string {
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(json, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(cursor: string): string {
  const pad = "=".repeat((4 - (cursor.length % 4)) % 4);
  const padded = cursor.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }
  return decodeURIComponent(escape(atob(padded)));
}

export function encodePostsCursor(created_at: string, id: string): string {
  return toBase64Url(JSON.stringify({ c: created_at, i: id }));
}

export function decodePostsCursor(cursor: string): { c: string; i: string } | null {
  try {
    const raw = fromBase64Url(cursor);
    const j = JSON.parse(raw) as { c?: string; i?: string };
    if (typeof j.c === "string" && typeof j.i === "string") return { c: j.c, i: j.i };
  } catch {
    /* ignore */
  }
  return null;
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    try {
      const u = new URL(`https://${t}`);
      if (u.hostname.includes(".")) return u.toString();
    } catch {
      return null;
    }
  }
  return null;
}

/** Returns normalized https? URLs, max `max` entries, drops invalid. */
export function parseCommunityLinks(input: unknown, max: number = COMMUNITY_MAX_LINKS): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (out.length >= max) break;
    if (typeof item !== "string") continue;
    const n = normalizeUrl(item);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function utcDayStartIso(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return d.toISOString();
}
