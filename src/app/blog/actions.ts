"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlogCommentFormState = {
  ok: boolean;
  error?: string;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function submitBlogComment(_prev: BlogCommentFormState, formData: FormData): Promise<BlogCommentFormState> {
  const blogPostId = String(formData.get("blog_post_id") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();
  const authorEmail = String(formData.get("author_email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const websiteRaw = String(formData.get("website_url") ?? "").trim();

  if (!blogPostId) {
    return { ok: false, error: "Missing post." };
  }
  if (authorName.length < 1 || authorName.length > 200) {
    return { ok: false, error: "Enter your name." };
  }
  if (!emailRe.test(authorEmail) || authorEmail.length > 320) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (body.length < 2 || body.length > 8000) {
    return { ok: false, error: "Comment must be between 2 and 8,000 characters." };
  }

  let website_url: string | null = null;
  if (websiteRaw) {
    const normalized = normalizeWebsiteUrl(websiteRaw);
    if (!normalized) {
      return { ok: false, error: "Enter a valid website URL or leave it blank." };
    }
    if (normalized.length > 500) {
      return { ok: false, error: "Website URL is too long." };
    }
    website_url = normalized;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("blog_post_comments").insert({
    blog_post_id: blogPostId,
    author_name: authorName,
    author_email: authorEmail,
    body,
    website_url,
    status: "pending",
  });

  if (error) {
    const isSchema = error.code === "PGRST205" || error.message.includes("schema cache");
    return {
      ok: false,
      error: isSchema ? "Comments are not available until the database migration is applied." : error.message,
    };
  }

  return { ok: true };
}
