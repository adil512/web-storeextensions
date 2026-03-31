"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, isValidStorePlatform, parseStorePlatform } from "@/lib/constants/listing";
import { isValidExtensionId, normalizeExtensionId } from "@/lib/extension-id";
import { allocateListingSlug } from "@/lib/listing-slug";
import { snapshotFromListingRow } from "@/lib/listing-snapshot";
import { slugifyBlogInput } from "@/lib/blog-slug";
import { isAdminRole, isSuperAdminRole } from "@/lib/profile-role";
import { getSupabaseServiceRoleEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_TABS = new Set([
  "overview",
  "queue",
  "featured",
  "people",
  "catalog",
  "analytics",
  "reports",
  "history",
  "blog",
  "comments",
]);

function adminRedirectTab(formData: FormData, fallback: string) {
  const t = String(formData.get("_tab") ?? "").trim();
  const tab = ADMIN_TABS.has(t) ? t : fallback;
  redirect(`/admin?tab=${tab}`);
}

async function revalidateExtensionListingPages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
) {
  const { data } = await supabase.from("extension_listings").select("slug").eq("id", listingId).maybeSingle();
  if (data?.slug) {
    revalidatePath(`/extensions/${data.slug}`);
  }
  revalidatePath(`/extensions/${listingId}`);
}

export async function updateListingStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as "approved" | "rejected";
  const reviewNotes = String(formData.get("reviewNotes") || "");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  await supabase
    .from("extension_listings")
    .update({
      status,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sell");
  await revalidateExtensionListingPages(supabase, id);
  adminRedirectTab(formData, "queue");
}

export async function updateFeaturedOrder(formData: FormData) {
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("featuredOrder") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  let featured_order: number | null = null;
  if (raw !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      adminRedirectTab(formData, "featured");
    }
    featured_order = n;
  }

  await supabase.from("extension_listings").update({ featured_order }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
  adminRedirectTab(formData, "featured");
}

export async function adminUpdateListing(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawFeatured = String(formData.get("featuredOrder") ?? "").trim();
  const extensionRaw = String(formData.get("extensionId") ?? "").trim();
  const storePlatformRaw = formData.get("storePlatform");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");
  let ownerUpdated = false;

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  if (!id || name.length < 2 || description.length < 1) {
    adminRedirectTab(formData, "catalog");
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    adminRedirectTab(formData, "catalog");
  }

  const normExt = normalizeExtensionId(extensionRaw);
  if (!isValidExtensionId(normExt)) {
    adminRedirectTab(formData, "catalog");
  }

  if (!isValidStorePlatform(storePlatformRaw)) {
    adminRedirectTab(formData, "catalog");
  }
  const store_platform = parseStorePlatform(storePlatformRaw);

  const { data: current } = await supabase.from("extension_listings").select("*").eq("id", id).maybeSingle();
  if (!current) {
    adminRedirectTab(formData, "catalog");
  }

  if (normExt !== normalizeExtensionId(String(current!.extension_id))) {
    const { data: conflict } = await supabase
      .from("extension_listings")
      .select("id")
      .eq("extension_id", normExt)
      .in("status", ["pending", "approved"])
      .neq("id", id)
      .maybeSingle();
    if (conflict) {
      adminRedirectTab(formData, "catalog");
    }
  }

  let featured_order: number | null = null;
  if (rawFeatured !== "") {
    const n = Number.parseInt(rawFeatured, 10);
    if (Number.isNaN(n) || n < 1) {
      adminRedirectTab(formData, "catalog");
    }
    featured_order = n;
  }

  let nextSlug = String((current as { slug?: string }).slug ?? "");
  if (name !== String(current!.name)) {
    nextSlug = await allocateListingSlug(supabase, name, id);
  }

  const listed_for_sale = String(formData.get("listedForSale") ?? "") === "on";

  await supabase.from("listing_versions").insert({
    listing_id: id,
    editor_id: user.id,
    snapshot: snapshotFromListingRow(current as Record<string, unknown>),
  });

  await supabase
    .from("extension_listings")
    .update({
      name,
      description,
      category,
      extension_id: normExt,
      store_platform,
      featured_order,
      slug: nextSlug,
      listed_for_sale,
    })
    .eq("id", id);

  const ownerIdForm = String(formData.get("ownerId") ?? "").trim();
  const ownerEmailNew = String(formData.get("ownerEmail") ?? "").trim();
  const ownerUsernameRaw = String(formData.get("ownerUsername") ?? "");
  const listingOwnerId = (current as { owner_id?: string | null }).owner_id ?? null;

  if (ownerIdForm && listingOwnerId && ownerIdForm === listingOwnerId) {
    if (!ownerEmailNew) {
      redirect(
        `/admin?tab=catalog&catalogError=${encodeURIComponent("Owner email is required when editing account fields.")}`,
      );
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(ownerEmailNew)) {
      redirect(`/admin?tab=catalog&catalogError=${encodeURIComponent("Invalid owner email address.")}`);
    }
    const ownerUsernameNorm = ownerUsernameRaw.trim().toLowerCase() || null;
    if (ownerUsernameNorm && (ownerUsernameNorm.length < 2 || ownerUsernameNorm.length > 39)) {
      redirect(
        `/admin?tab=catalog&catalogError=${encodeURIComponent("Username must be 2–39 characters, or leave empty.")}`,
      );
    }
    if (ownerUsernameNorm && !/^[a-z0-9][a-z0-9_-]*$/.test(ownerUsernameNorm)) {
      redirect(
        `/admin?tab=catalog&catalogError=${encodeURIComponent("Username may only use lowercase letters, digits, underscores, and hyphens.")}`,
      );
    }

    try {
      const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceRoleEnv();
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: prevProfile, error: prevErr } = await adminClient
        .from("profiles")
        .select("email, username")
        .eq("id", ownerIdForm)
        .maybeSingle();

      if (prevErr || !prevProfile) {
        redirect(
          `/admin?tab=catalog&catalogError=${encodeURIComponent(prevErr?.message || "Could not load owner profile.")}`,
        );
      }

      const prevEmail = String(prevProfile.email ?? "").trim();
      const prevUser = (prevProfile.username ? String(prevProfile.username).trim().toLowerCase() : null) as string | null;
      const emailChanged = ownerEmailNew !== prevEmail;
      const usernameChanged = ownerUsernameNorm !== prevUser;

      if (emailChanged) {
        const { error: authErr } = await adminClient.auth.admin.updateUserById(ownerIdForm, {
          email: ownerEmailNew,
          email_confirm: true,
        });
        if (authErr) {
          redirect(`/admin?tab=catalog&catalogError=${encodeURIComponent(authErr.message)}`);
        }
      }

      if (emailChanged || usernameChanged) {
        const { error: profErr } = await adminClient
          .from("profiles")
          .update({
            email: ownerEmailNew,
            username: ownerUsernameNorm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ownerIdForm);
        if (profErr) {
          redirect(`/admin?tab=catalog&catalogError=${encodeURIComponent(profErr.message)}`);
        }
        revalidatePath("/u", "layout");
        ownerUpdated = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("SUPABASE_SERVICE_ROLE_KEY") || msg.includes("NEXT_PUBLIC_SUPABASE_URL")) {
        redirect(
          `/admin?tab=catalog&catalogError=${encodeURIComponent(
            "Set SUPABASE_SERVICE_ROLE_KEY on the server to update owner email or username from this form.",
          )}`,
        );
      }
      throw e;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sell");
  await revalidateExtensionListingPages(supabase, id);
  if (ownerUpdated) {
    redirect(`/admin?tab=catalog&catalogNotice=${encodeURIComponent("Owner updated successfully.")}`);
  }
  adminRedirectTab(formData, "catalog");
}

export async function updateReportStatus(formData: FormData) {
  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "") as "reviewed" | "dismissed";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  if (!reportId || (status !== "reviewed" && status !== "dismissed")) {
    adminRedirectTab(formData, "reports");
  }

  await supabase.from("listing_reports").update({ status }).eq("id", reportId);
  revalidatePath("/admin");
  adminRedirectTab(formData, "reports");
}

export async function toggleBan(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const isBanned = String(formData.get("isBanned") || "") === "true";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isSuperAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  await supabase.from("profiles").update({ is_banned: isBanned }).eq("id", userId);
  revalidatePath("/admin");
  adminRedirectTab(formData, "people");
}

export async function deleteExtensionListing(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  if (!id) {
    adminRedirectTab(formData, "catalog");
  }

  await revalidateExtensionListingPages(supabase, id);

  const { error } = await supabase.from("extension_listings").delete().eq("id", id);

  const returnTab = (() => {
    const t = String(formData.get("_tab") ?? "").trim();
    return ADMIN_TABS.has(t) ? t : "catalog";
  })();

  if (error) {
    redirect(`/admin?tab=${returnTab}&deleteError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sell");
  revalidatePath("/categories", "layout");
  revalidatePath("/u", "layout");
  revalidatePath("/leaderboard");

  redirect(`/admin?tab=${returnTab}&deleted=1`);
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isSuperAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }
  return { supabase, user };
}

export async function createBlogPost(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugifyBlogInput(slugRaw || title);
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "");
  const meta_title = String(formData.get("meta_title") ?? "").trim() || null;
  const meta_description = String(formData.get("meta_description") ?? "").trim() || null;
  const canonical_url = String(formData.get("canonical_url") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
  const published = String(formData.get("published") ?? "") === "true";

  if (!title || !body.trim()) {
    redirect("/admin?tab=blog&blogError=" + encodeURIComponent("Title and body are required."));
  }

  const { error } = await supabase.from("blog_posts").insert({
    slug,
    title,
    excerpt,
    body,
    meta_title,
    meta_description,
    canonical_url,
    cover_image_url,
    published,
    author_id: user.id,
  });

  if (error) {
    redirect("/admin?tab=blog&blogError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin");
  redirect("/admin?tab=blog&blogNotice=saved");
}

export async function updateBlogPost(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugifyBlogInput(slugRaw || title);
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "");
  const meta_title = String(formData.get("meta_title") ?? "").trim() || null;
  const meta_description = String(formData.get("meta_description") ?? "").trim() || null;
  const canonical_url = String(formData.get("canonical_url") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
  const published = String(formData.get("published") ?? "") === "true";

  if (!id || !title || !body.trim()) {
    redirect("/admin?tab=blog&blogError=" + encodeURIComponent("Missing id, title, or body."));
  }

  const { data: prev } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug,
      title,
      excerpt,
      body,
      meta_title,
      meta_description,
      canonical_url,
      cover_image_url,
      published,
    })
    .eq("id", id);

  if (error) {
    redirect("/admin?tab=blog&blogError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/blog");
  if (prev?.slug) revalidatePath(`/blog/${prev.slug}`);
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin");
  redirect("/admin?tab=blog&blogNotice=saved");
}

export async function deleteBlogPost(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin?tab=blog");

  const { data: prev } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    redirect("/admin?tab=blog&blogError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/blog");
  if (prev?.slug) revalidatePath(`/blog/${prev.slug}`);
  revalidatePath("/admin");
  redirect("/admin?tab=blog&blogNotice=deleted");
}

export async function moderateBlogComment(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || (status !== "approved" && status !== "rejected")) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Invalid request."));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  const { data: row } = await supabase.from("blog_post_comments").select("blog_posts(slug)").eq("id", id).maybeSingle();

  const bp = row?.blog_posts as { slug?: string } | { slug?: string }[] | null | undefined;
  const postSlug = Array.isArray(bp) ? bp[0]?.slug : bp?.slug;

  const { error } = await supabase
    .from("blog_post_comments")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);

  if (error) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent(error.message));
  }

  if (postSlug) {
    revalidatePath(`/blog/${postSlug}`);
  }
  revalidatePath("/admin");
  redirect("/admin?tab=comments&commentNotice=" + encodeURIComponent(status === "approved" ? "approved" : "rejected"));
}

const emailReBlogAdmin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeBlogCommentWebsiteUrl(raw: string): string | null {
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

export async function updateBlogCommentAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const author_name = String(formData.get("author_name") ?? "").trim();
  const author_email = String(formData.get("author_email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const websiteRaw = String(formData.get("website_url") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim().toLowerCase();

  if (!id) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Missing comment id."));
  }
  if (author_name.length < 1 || author_name.length > 200) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Name must be 1–200 characters."));
  }
  if (!emailReBlogAdmin.test(author_email) || author_email.length > 320) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Invalid email."));
  }
  if (body.length < 2 || body.length > 8000) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Comment body must be 2–8,000 characters."));
  }
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Invalid status."));
  }

  let website_url: string | null = null;
  if (websiteRaw) {
    const normalized = normalizeBlogCommentWebsiteUrl(websiteRaw);
    if (!normalized || normalized.length > 500) {
      redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Invalid website URL."));
    }
    website_url = normalized;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  const { data: row } = await supabase.from("blog_post_comments").select("blog_posts(slug)").eq("id", id).maybeSingle();

  const bp = row?.blog_posts as { slug?: string } | { slug?: string }[] | null | undefined;
  const postSlug = Array.isArray(bp) ? bp[0]?.slug : bp?.slug;

  const isPending = status === "pending";
  const { error } = await supabase
    .from("blog_post_comments")
    .update({
      author_name,
      author_email,
      body,
      website_url,
      status,
      reviewed_at: isPending ? null : new Date().toISOString(),
      reviewed_by: isPending ? null : user.id,
    })
    .eq("id", id);

  if (error) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent(error.message));
  }

  if (postSlug) {
    revalidatePath(`/blog/${postSlug}`);
  }
  revalidatePath("/admin");
  redirect("/admin?tab=comments&commentNotice=updated");
}

export async function deleteBlogComment(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent("Missing comment id."));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  const { data: row } = await supabase.from("blog_post_comments").select("blog_posts(slug)").eq("id", id).maybeSingle();

  const bp = row?.blog_posts as { slug?: string } | { slug?: string }[] | null | undefined;
  const postSlug = Array.isArray(bp) ? bp[0]?.slug : bp?.slug;

  const { error } = await supabase.from("blog_post_comments").delete().eq("id", id);

  if (error) {
    redirect("/admin?tab=comments&commentError=" + encodeURIComponent(error.message));
  }

  if (postSlug) {
    revalidatePath(`/blog/${postSlug}`);
  }
  revalidatePath("/admin");
  redirect("/admin?tab=comments&commentNotice=deleted");
}
