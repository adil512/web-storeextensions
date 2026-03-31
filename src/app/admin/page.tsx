import { redirect } from "next/navigation";
import AdminDashboard, {
  type AdminAnalyticsRow,
  type AdminBlogCommentRow,
  type AdminBlogPostRow,
  type AdminCatalogRow,
  type AdminFeaturedRow,
  type AdminReportRow,
  type AdminVersionRow,
} from "@/components/admin/admin-dashboard";
import { isAdminRole, isSuperAdminRole } from "@/lib/profile-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CATALOG_SELECT =
  "id,slug,name,description,category,status,featured_order,is_platform_curated,extension_id,store_platform,featured_placement_requested,listed_for_sale,listing_country,listing_region,listing_city,updated_at,owner_id,profiles!extension_listings_owner_id_fkey(username,email)";

const ADMIN_TABS = [
  "overview",
  "queue",
  "featured",
  "catalog",
  "analytics",
  "reports",
  "history",
  "blog",
  "comments",
  "people",
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    deleted?: string;
    deleteError?: string;
    blogNotice?: string;
    blogError?: string;
    commentNotice?: "approved" | "rejected" | "updated" | "deleted" | string;
    commentError?: string;
    catalogError?: string;
    catalogNotice?: string;
  }>;
}) {
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=required");

  const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    redirect("/admin/login?error=forbidden");
  }

  const superAdmin = isSuperAdminRole(me.role);

  const tabParam = typeof sp.tab === "string" ? sp.tab : undefined;
  const resolvedTab = ADMIN_TABS.find((t) => t === tabParam);
  const initialSection =
    resolvedTab === "blog" && !superAdmin ? "overview" : resolvedTab ?? "overview";

  const adminFlash =
    sp.deleted === "1"
      ? ({ kind: "success" as const, message: "Listing removed permanently." })
      : sp.blogNotice === "saved"
        ? ({ kind: "success" as const, message: "Blog post saved." })
        : sp.blogNotice === "deleted"
          ? ({ kind: "success" as const, message: "Blog post deleted." })
          : typeof sp.catalogNotice === "string" && sp.catalogNotice.trim()
            ? ({ kind: "success" as const, message: sp.catalogNotice.trim() })
          : typeof sp.blogError === "string" && sp.blogError.trim()
            ? ({ kind: "error" as const, message: sp.blogError.trim() })
            : sp.commentNotice === "approved"
              ? ({ kind: "success" as const, message: "Comment approved." })
              : sp.commentNotice === "rejected"
                ? ({ kind: "success" as const, message: "Comment rejected." })
                : sp.commentNotice === "updated"
                  ? ({ kind: "success" as const, message: "Comment updated." })
                  : sp.commentNotice === "deleted"
                  ? ({ kind: "success" as const, message: "Comment deleted." })
                  : typeof sp.commentError === "string" && sp.commentError.trim()
                    ? ({ kind: "error" as const, message: sp.commentError.trim() })
                    : typeof sp.deleteError === "string" && sp.deleteError.trim()
                      ? ({ kind: "error" as const, message: sp.deleteError.trim() })
                      : typeof sp.catalogError === "string" && sp.catalogError.trim()
                        ? ({ kind: "error" as const, message: sp.catalogError.trim() })
                        : null;

  const [
    pendingRes,
    approvedRes,
    usersRes,
    recentRes,
    catalogPendingRes,
    catalogApprovedRes,
    catalogRejectedRes,
    topAnalyticsRes,
    openReportsRes,
    versionsRes,
    pendingCountRes,
    approvedCountRes,
    rejectedCountRes,
    userCountRes,
    featuredCountRes,
  ] = await Promise.all([
    supabase
      .from("extension_listings")
      .select(
        "id,slug,name,description,status,created_at,extension_id,featured_placement_requested,profiles!extension_listings_owner_id_fkey(username,email)",
      )
      .eq("status", "pending")
      .order("featured_placement_requested", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("extension_listings")
      .select("id,slug,name,category,featured_order,is_platform_curated,status")
      .eq("status", "approved")
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id,email,username,role,is_banned,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("extension_listings").select("id,slug,name,status,updated_at").order("updated_at", { ascending: false }).limit(12),
    supabase
      .from("extension_listings")
      .select(CATALOG_SELECT)
      .eq("status", "pending")
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("extension_listings")
      .select(CATALOG_SELECT)
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("extension_listings")
      .select(CATALOG_SELECT)
      .eq("status", "rejected")
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("extension_listings")
      .select("id,slug,name,view_count,store_click_count,category,status")
      .eq("status", "approved")
      .order("view_count", { ascending: false })
      .limit(25),
    supabase
      .from("listing_reports")
      .select("id,reason,details,status,created_at,listing_id")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("listing_versions")
      .select(
        `
        id,
        created_at,
        listing_id,
        editor_id,
        snapshot,
        extension_listings ( name )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("extension_listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("extension_listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("extension_listings").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("extension_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .not("featured_order", "is", null),
  ]);

  const pendingRows = pendingRes.data ?? [];
  const extIds = [...new Set(pendingRows.map((p) => p.extension_id).filter(Boolean))] as string[];
  let rejectedExtSet = new Set<string>();
  if (extIds.length > 0) {
    const { data: rejRows } = await supabase
      .from("extension_listings")
      .select("extension_id")
      .eq("status", "rejected")
      .in("extension_id", extIds);
    rejectedExtSet = new Set((rejRows ?? []).map((r) => r.extension_id).filter(Boolean) as string[]);
  }

  const pending = pendingRows.map((p) => ({
    ...p,
    dupSameIdRejected: rejectedExtSet.has(p.extension_id),
  }));

  const catalog = [
    ...(catalogPendingRes.data ?? []),
    ...(catalogApprovedRes.data ?? []),
    ...(catalogRejectedRes.data ?? []),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) as AdminCatalogRow[];

  const stats = {
    pending: pendingCountRes.count ?? 0,
    approved: approvedCountRes.count ?? 0,
    rejected: rejectedCountRes.count ?? 0,
    users: userCountRes.count ?? 0,
    featured: featuredCountRes.count ?? 0,
  };

  const blogPostsRes = superAdmin
    ? await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })
    : { data: [] as AdminBlogPostRow[] };

  const blogCommentsRes = await supabase
    .from("blog_post_comments")
    .select("id,blog_post_id,author_name,author_email,body,website_url,status,created_at,blog_posts(title,slug)")
    .order("created_at", { ascending: false })
    .limit(400);

  return (
    <AdminDashboard
      initialSection={initialSection}
      adminFlash={adminFlash}
      superAdmin={superAdmin}
      meEmail={me.email}
      meRole={me.role}
      stats={stats}
      pending={pending}
      approvedForFeatured={(approvedRes.data ?? []) as AdminFeaturedRow[]}
      users={usersRes.data ?? []}
      recentActivity={recentRes.data ?? []}
      catalog={catalog}
      topPerformers={(topAnalyticsRes.data ?? []) as AdminAnalyticsRow[]}
      openReports={(openReportsRes.data ?? []) as AdminReportRow[]}
      recentVersions={(versionsRes.data ?? []) as AdminVersionRow[]}
      blogPosts={(blogPostsRes.data ?? []) as AdminBlogPostRow[]}
      blogComments={(blogCommentsRes.data ?? []) as AdminBlogCommentRow[]}
    />
  );
}
