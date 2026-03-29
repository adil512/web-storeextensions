import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const { supabase, user } = await requireAuth();
  const body = await request.json();

  const facebook = typeof body.facebookUrl === "string" ? body.facebookUrl.trim() : "";
  const xUrl = typeof body.xUrl === "string" ? body.xUrl.trim() : "";
  const linkedin = typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";

  const social_links: Record<string, string> = {};
  if (facebook) social_links.facebook = facebook;
  if (xUrl) social_links.x = xUrl;
  if (linkedin) social_links.linkedin = linkedin;

  const payload = {
    id: user.id,
    email: user.email,
    username: body.username?.trim().toLowerCase() || null,
    full_name: body.fullName?.trim() || null,
    avatar_url: body.avatarUrl?.trim() || null,
    bio: body.bio?.trim() || null,
    website_url: body.websiteUrl?.trim() || null,
    social_links,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) {
    const isSchemaCacheMiss = error.code === "PGRST205" || error.message.includes("schema cache");
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") ?? "unknown";
    const actionable = isSchemaCacheMiss
      ? `Supabase REST cannot see table profiles yet. Verify .env.local points to the same project (${supabaseHost}), run migration SQL there, then refresh API schema by opening Database > Tables once and retry in 30s.`
      : error.message;
    return NextResponse.json({ error: actionable, rawError: error.message, code: error.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
