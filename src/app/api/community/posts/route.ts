import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COMMUNITY_LOAD_MORE_SIZE, decodePostsCursor, encodePostsCursor, parseCommunityLinks } from "@/lib/community";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || COMMUNITY_LOAD_MORE_SIZE);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : COMMUNITY_LOAD_MORE_SIZE));
  const cursorParam = url.searchParams.get("cursor");

  let p_after_created: string | null = null;
  let p_after_id: string | null = null;
  if (cursorParam) {
    const d = decodePostsCursor(cursorParam);
    if (d) {
      p_after_created = d.c;
      p_after_id = d.i;
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("community_posts_page", {
    page_limit: limit,
    p_after_created,
    p_after_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const posts = rows.map((r) => ({
    id: String(r.id),
    author_id: String(r.author_id),
    body: String(r.body),
    links: r.links,
    comment_count: Number(r.comment_count ?? 0),
    created_at: String(r.created_at),
    username: r.username != null ? String(r.username) : null,
    full_name: r.full_name != null ? String(r.full_name) : null,
  }));

  const last = posts[posts.length - 1];
  const nextCursor =
    posts.length > 0 && posts.length === limit ? encodePostsCursor(last.created_at, last.id) : null;

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("is_banned").eq("id", user.id).maybeSingle();
  if (profile?.is_banned) {
    return NextResponse.json({ error: "Your account is banned." }, { status: 403 });
  }

  const bodyJson = await request.json().catch(() => null);
  const bodyText = typeof bodyJson?.body === "string" ? bodyJson.body.trim() : "";
  if (!bodyText || bodyText.length > 12000) {
    return NextResponse.json({ error: "Write something (max 12,000 characters)." }, { status: 400 });
  }

  const links = parseCommunityLinks(bodyJson?.links);

  const { data: inserted, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: user.id,
      body: bodyText,
      links,
    })
    .select("id,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You can only publish one community post per calendar day (UTC). Try again tomorrow." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: inserted.id, created_at: inserted.created_at });
}
