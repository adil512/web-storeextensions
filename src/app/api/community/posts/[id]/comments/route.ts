import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id: postId } = await ctx.params;
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase.from("community_posts").select("id").eq("id", postId).maybeSingle();
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("community_post_comments")
    .select("id,post_id,author_id,body,created_at,profiles(username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const comments = (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.profiles as { username?: string | null } | { username?: string | null }[] | null | undefined;
    const prof = Array.isArray(p) ? p[0] : p;
    return {
      id: String(row.id),
      post_id: String(row.post_id),
      author_id: String(row.author_id),
      body: String(row.body),
      created_at: String(row.created_at),
      username: prof?.username ?? null,
    };
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, ctx: Ctx) {
  const { id: postId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("is_banned").eq("id", user.id).maybeSingle();
  if (profile?.is_banned) {
    return NextResponse.json({ error: "Your account is banned." }, { status: 403 });
  }

  const { data: post } = await supabase.from("community_posts").select("id").eq("id", postId).maybeSingle();
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const bodyJson = await request.json().catch(() => null);
  const text = typeof bodyJson?.body === "string" ? bodyJson.body.trim() : "";
  if (!text || text.length > 4000) {
    return NextResponse.json({ error: "Comment cannot be empty (max 4,000 characters)." }, { status: 400 });
  }

  const { error } = await supabase.from("community_post_comments").insert({
    post_id: postId,
    author_id: user.id,
    body: text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
