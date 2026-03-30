"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  adminUpdateListing,
  createBlogPost,
  deleteBlogPost,
  deleteExtensionListing,
  moderateBlogComment,
  updateBlogCommentAdmin,
  updateBlogPost,
  updateFeaturedOrder,
  updateListingStatus,
  toggleBan,
  updateReportStatus,
} from "@/app/admin/actions";
import { AdminBlogCommentDeleteForm } from "@/components/admin/admin-blog-comment-delete-form";
import { BlogBodyEditor } from "@/components/admin/blog-body-editor";
import { SITE_NAME } from "@/lib/brand";
import { CATEGORIES, STORE_PLATFORM_OPTIONS, parseStorePlatform } from "@/lib/constants/listing";
import { extensionListingHref } from "@/lib/listing-slug";

export type AdminStats = {
  pending: number;
  approved: number;
  rejected: number;
  users: number;
  featured: number;
};

export type AdminPendingRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  extension_id: string;
  featured_placement_requested?: boolean | null;
  dupSameIdRejected?: boolean;
  profiles:
    | { username?: string | null; email?: string | null }
    | { username?: string | null; email?: string | null }[]
    | null;
};

export type AdminFeaturedRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  featured_order: number | null;
  is_platform_curated?: boolean | null;
};

export type AdminUserRow = {
  id: string;
  email: string;
  username: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
};

export type AdminActivityRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  updated_at: string;
};

export type AdminCatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: string;
  extension_id: string;
  store_platform: string | null;
  featured_placement_requested?: boolean | null;
  owner_id: string | null;
  featured_order: number | null;
  listing_country: string | null;
  listing_region: string | null;
  listing_city: string | null;
  updated_at: string;
  is_platform_curated?: boolean | null;
  profiles: AdminPendingRow["profiles"];
};

export type AdminAnalyticsRow = {
  id: string;
  slug: string;
  name: string;
  view_count: number;
  store_click_count: number;
  category: string;
  status: string;
};

export type AdminReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing_id: string;
};

export type AdminVersionRow = {
  id: string;
  created_at: string;
  listing_id: string;
  editor_id: string;
  snapshot: Record<string, unknown>;
  extension_listings: { name: string } | { name: string }[] | null;
};

export type AdminBlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminBlogCommentRow = {
  id: string;
  blog_post_id: string;
  author_name: string;
  author_email: string;
  body: string;
  website_url: string | null;
  status: string;
  created_at: string;
  blog_posts: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

export type AdminSection =
  | "overview"
  | "queue"
  | "featured"
  | "people"
  | "catalog"
  | "analytics"
  | "reports"
  | "history"
  | "blog"
  | "comments";

function blogCommentPostMeta(row: AdminBlogCommentRow) {
  const bp = row.blog_posts;
  const p = Array.isArray(bp) ? bp[0] : bp;
  return { title: p?.title ?? "—", slug: p?.slug ?? "" };
}

function geoSummary(row: Pick<AdminCatalogRow, "listing_city" | "listing_region" | "listing_country">) {
  const parts = [row.listing_city, row.listing_region, row.listing_country].filter(
    (x): x is string => Boolean(x && String(x).trim()),
  );
  return parts.length ? parts.join(" · ") : "Not captured (local dev or no edge headers)";
}

function ownerLabel(profiles: AdminPendingRow["profiles"]) {
  const p = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!p) return "Unknown submitter";
  if (p.username) return `@${p.username}`;
  return p.email || "Unknown submitter";
}

/** Fixed locale so server-rendered HTML matches the browser (avoids hydration mismatches). */
function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function NavIcon({ name }: { name: "home" | "inbox" | "star" | "users" | "table" | "chart" | "flag" | "clock" | "book" | "chat" }) {
  const cls = "h-5 w-5 shrink-0";
  if (name === "chat")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.043 4.043 0 01-.547 1.641l-.154.307A2.25 2.25 0 003 20.25z"
        />
      </svg>
    );
  if (name === "book")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    );
  if (name === "home")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  if (name === "inbox")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.862M9.75 6h6m-6 3h6m-6 3h6" />
      </svg>
    );
  if (name === "star")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    );
  if (name === "table")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h3.75A2.25 2.25 0 0112 6v3.75A2.25 2.25 0 019.75 12H6A2.25 2.25 0 013.75 9.75V6zM3.75 15A2.25 2.25 0 016 12.75h3.75A2.25 2.25 0 0112 15v3.75A2.25 2.25 0 019.75 21H6a2.25 2.25 0 01-2.25-2.25V15zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v3.75A2.25 2.25 0 0118 12h-2.25A2.25 2.25 0 0113.5 9.75V6zM13.5 15a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-3z" />
      </svg>
    );
  if (name === "chart")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    );
  if (name === "flag")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 00-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    );
  if (name === "clock")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "zinc" | "amber" | "emerald" | "orange";
}) {
  const ring =
    tone === "amber"
      ? "ring-amber-200/80 bg-gradient-to-br from-amber-50 to-white"
      : tone === "emerald"
        ? "ring-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white"
        : tone === "orange"
          ? "ring-orange-200/80 bg-gradient-to-br from-orange-50 to-white"
          : "ring-zinc-200/80 bg-white";
  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 ${ring}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const r = role.trim();
  if (r === "super_admin")
    return (
      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
        Super admin
      </span>
    );
  if (r === "admin")
    return (
      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">Admin</span>
    );
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">User</span>
  );
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color =
    s === "approved" ? "bg-emerald-500" : s === "pending" ? "bg-amber-500" : s === "rejected" ? "bg-red-500" : "bg-zinc-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {status}
    </span>
  );
}

function versionListingName(v: AdminVersionRow) {
  const ln = v.extension_listings;
  const row = Array.isArray(ln) ? ln[0] : ln;
  return row?.name ?? "—";
}

export default function AdminDashboard({
  initialSection,
  adminFlash,
  superAdmin,
  meEmail,
  meRole,
  stats,
  pending,
  approvedForFeatured,
  users,
  recentActivity,
  catalog,
  topPerformers,
  openReports,
  recentVersions,
  blogPosts,
  blogComments,
}: {
  initialSection: AdminSection;
  adminFlash: { kind: "success" | "error"; message: string } | null;
  superAdmin: boolean;
  meEmail: string;
  meRole: string;
  stats: AdminStats;
  pending: AdminPendingRow[];
  approvedForFeatured: AdminFeaturedRow[];
  users: AdminUserRow[];
  recentActivity: AdminActivityRow[];
  catalog: AdminCatalogRow[];
  topPerformers: AdminAnalyticsRow[];
  openReports: AdminReportRow[];
  recentVersions: AdminVersionRow[];
  blogPosts: AdminBlogPostRow[];
  blogComments: AdminBlogCommentRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [userQuery, setUserQuery] = useState("");
  const [featuredQuery, setFeaturedQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [openCatalogId, setOpenCatalogId] = useState<string | null>(null);
  const [openBlogId, setOpenBlogId] = useState<string | null>(null);
  const [showNewBlog, setShowNewBlog] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (section !== "comments") setEditingCommentId(null);
  }, [section]);

  const goSection = (id: AdminSection) => {
    setSection(id);
    router.replace(`${pathname}?tab=${id}`, { scroll: false });
  };

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, userQuery]);

  const filteredFeatured = useMemo(() => {
    const q = featuredQuery.trim().toLowerCase();
    if (!q) return approvedForFeatured;
    return approvedForFeatured.filter(
      (r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q),
    );
  }, [approvedForFeatured, featuredQuery]);

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.listing_country && r.listing_country.toLowerCase().includes(q)) ||
        (r.listing_city && r.listing_city.toLowerCase().includes(q)),
    );
  }, [catalog, catalogQuery]);

  const pendingBlogCommentCount = useMemo(
    () => blogComments.filter((c) => c.status === "pending").length,
    [blogComments],
  );

  const sortedBlogComments = useMemo(() => {
    const rank = (s: string) => (s === "pending" ? 0 : s === "approved" ? 1 : 2);
    return [...blogComments].sort((a, b) => {
      const dr = rank(a.status) - rank(b.status);
      if (dr !== 0) return dr;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [blogComments]);

  const navItems: {
    id: AdminSection;
    label: string;
    icon: "home" | "inbox" | "star" | "users" | "table" | "chart" | "flag" | "clock" | "book" | "chat";
    badge?: number;
  }[] = useMemo(() => {
    const base: {
      id: AdminSection;
      label: string;
      icon: "home" | "inbox" | "star" | "users" | "table" | "chart" | "flag" | "clock" | "book" | "chat";
      badge?: number;
    }[] = [
      { id: "overview", label: "Overview", icon: "home" },
      { id: "queue", label: "Review queue", icon: "inbox", badge: stats.pending },
      { id: "featured", label: "Featured", icon: "star" },
      { id: "catalog", label: "Edit listings", icon: "table" },
      { id: "analytics", label: "Analytics", icon: "chart" },
      { id: "reports", label: "Reports", icon: "flag", badge: openReports.length },
      { id: "history", label: "Version history", icon: "clock" },
    ];
    if (superAdmin) base.push({ id: "blog", label: "Blog", icon: "book" });
    base.push({ id: "comments", label: "Blog comments", icon: "chat", badge: pendingBlogCommentCount });
    base.push({ id: "people", label: "Users", icon: "users" });
    return base;
  }, [superAdmin, stats.pending, openReports.length, pendingBlogCommentCount]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200/80 bg-zinc-950 text-zinc-300 lg:flex">
        <div className="border-b border-zinc-800/80 px-5 py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/90">{SITE_NAME}</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-white">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                section === item.id
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-800/80 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            ← Back to site
          </Link>
          <Link
            href="/admin/login"
            className="mt-1 block rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            Staff login page
          </Link>
        </div>
      </aside>

      {/* Mobile section tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white p-2 lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goSection(item.id)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
              section === item.id ? "bg-orange-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {item.label}
            {item.badge != null && item.badge > 0 ? ` (${item.badge})` : ""}
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
              {section === "overview" && "Overview"}
              {section === "queue" && "Review queue"}
              {section === "featured" && "Featured on homepage"}
              {section === "catalog" && "Edit listings"}
              {section === "analytics" && "Analytics dashboard"}
              {section === "reports" && "User reports"}
              {section === "history" && "Version history"}
              {section === "blog" && "Blog"}
              {section === "comments" && "Blog comments"}
              {section === "people" && "User directory"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {section === "overview" && "Metrics, activity, and quick context for your directory."}
              {section === "queue" && "Approve or reject submissions. Notes are stored on the listing."}
              {section === "featured" && "Control carousel order on the homepage (lower = earlier)."}
              {section === "catalog" &&
                "Fix miscategorized listings, assign featured slots for paid placements, and update copy. Submit location is captured from edge headers when available."}
              {section === "analytics" && "Top extensions by page views and outbound store clicks."}
              {section === "reports" && "Open reports from signed-in users. Mark reviewed when handled."}
              {section === "history" && "Snapshots saved when makers edit pending listings or admins save changes."}
              {section === "blog" &&
                "Create and manage posts for the public blog. Set SEO meta title, description, and canonical URL per article."}
              {section === "comments" &&
                "Approve or reject reader comments on published posts. Email addresses are hidden from the public site."}
              {section === "people" && "Search profiles. Super admins can ban accounts."}
            </p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              superAdmin ? "border-emerald-200 bg-emerald-50/90 text-emerald-950" : "border-amber-200 bg-amber-50/90 text-amber-950"
            }`}
          >
            <p className="font-medium text-zinc-900">{meEmail}</p>
            <p className="mt-0.5 text-xs opacity-90">
              Role: <span className="font-mono font-semibold">{meRole}</span>
              {superAdmin ? " · Blog & ban tools" : " · Moderation only"}
            </p>
          </div>
        </header>

        {adminFlash ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              adminFlash.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-red-200 bg-red-50 text-red-950"
            }`}
            role="alert"
          >
            <p className="font-medium">{adminFlash.message}</p>
            {adminFlash.kind === "error" ? (
              <p className="mt-2 text-xs opacity-90">
                If this mentions permission or RLS, apply the relevant migration on Supabase (e.g.{" "}
                <code className="rounded bg-red-100/80 px-1 py-0.5 font-mono text-[11px]">0014_admin_delete_extension_listings.sql</code>,{" "}
                <code className="rounded bg-red-100/80 px-1 py-0.5 font-mono text-[11px]">0015_blog_posts.sql</code>,{" "}
                <code className="rounded bg-red-100/80 px-1 py-0.5 font-mono text-[11px]">0016_blog_post_comments.sql</code>,{" "}
                <code className="rounded bg-red-100/80 px-1 py-0.5 font-mono text-[11px]">0017_blog_post_comments_admin_delete.sql</code>).
              </p>
            ) : null}
          </div>
        ) : null}

        {section === "overview" ? (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Pending review" value={stats.pending} hint="Needs a decision" tone="amber" />
              <StatCard label="Live listings" value={stats.approved} hint="Approved & public-capable" tone="emerald" />
              <StatCard label="Rejected" value={stats.rejected} hint="Historical count" tone="zinc" />
              <StatCard label="Featured slots" value={stats.featured} hint="Homepage carousel" tone="orange" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Directory size</h2>
                <p className="mt-4 text-4xl font-black tabular-nums text-zinc-900">{stats.users}</p>
                <p className="mt-1 text-sm text-zinc-500">Registered profiles (latest 200 shown in Users tab)</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Recent listing changes</h2>
                <ul className="mt-4 space-y-3">
                  {recentActivity.length === 0 ? (
                    <li className="text-sm text-zinc-500">No recent updates.</li>
                  ) : (
                    recentActivity.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <Link
                            href={extensionListingHref({ id: row.id, slug: row.slug })}
                            className="truncate font-medium text-zinc-900 hover:text-orange-600"
                          >
                            {row.name}
                          </Link>
                          <p className="text-xs text-zinc-500">{formatShortDate(row.updated_at)}</p>
                        </div>
                        <StatusDot status={row.status} />
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => goSection("queue")}
                className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
              >
                Open review queue
              </button>
              <button
                type="button"
                onClick={() => goSection("featured")}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Manage featured
              </button>
              <button
                type="button"
                onClick={() => goSection("catalog")}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Edit listings
              </button>
              <button
                type="button"
                onClick={() => goSection("analytics")}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Analytics
              </button>
            </div>
          </div>
        ) : null}

        {section === "queue" ? (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 py-16 text-center">
                <p className="text-lg font-semibold text-zinc-800">Queue is clear</p>
                <p className="mt-2 text-sm text-zinc-500">New submissions will show up here for approval.</p>
              </div>
            ) : (
              pending.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100"
                >
                  <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{listing.name}</h3>
                        <p className="mt-1 font-mono text-[11px] text-zinc-500">Extension ID: {listing.extension_id}</p>
                        {listing.dupSameIdRejected ? (
                          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                            Duplicate signal: a rejected listing used this same Extension ID before — review carefully.
                          </p>
                        ) : null}
                        {listing.featured_placement_requested ? (
                          <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-950">
                            <p className="font-bold text-violet-900">Featured placement requested</p>
                            <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
                              Submitter opted in for paid featured placement. Verify payment against{" "}
                              <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:text-violet-950">
                                Pricing
                              </Link>
                              , then approve and assign a{" "}
                              <button
                                type="button"
                                onClick={() => goSection("featured")}
                                className="font-semibold underline underline-offset-2 hover:text-violet-950"
                              >
                                featured order
                              </button>{" "}
                              (1–99) so it appears in the homepage carousel.
                            </p>
                          </div>
                        ) : null}
                        <p className="mt-1 text-xs text-zinc-500">
                          {ownerLabel(listing.profiles)} · Submitted {formatShortDate(listing.created_at)}
                        </p>
                      </div>
                      <Link
                        href={extensionListingHref({ id: listing.id, slug: listing.slug })}
                        className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Preview listing →
                      </Link>
                    </div>
                  </div>
                  <div className="px-5 py-4 sm:px-6">
                    <p className="text-sm leading-relaxed text-zinc-600 line-clamp-4 sm:line-clamp-none">{listing.description}</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <form action={updateListingStatus} className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                        <input type="hidden" name="_tab" value="queue" />
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="approved" />
                        <label className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Approve</label>
                        <textarea
                          name="reviewNotes"
                          rows={2}
                          placeholder="Optional public-facing note…"
                          className="mt-2 w-full rounded-lg border border-emerald-200/80 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <button
                          type="submit"
                          className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Approve listing
                        </button>
                      </form>
                      <form action={updateListingStatus} className="rounded-xl border border-red-200/80 bg-red-50/40 p-4">
                        <input type="hidden" name="_tab" value="queue" />
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <label className="text-xs font-semibold uppercase tracking-wide text-red-900">Reject</label>
                        <textarea
                          name="reviewNotes"
                          rows={2}
                          placeholder="Reason (shown to submitter if you surface it)…"
                          className="mt-2 w-full rounded-lg border border-red-200/80 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                        <button
                          type="submit"
                          className="mt-3 w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-50"
                        >
                          Reject listing
                        </button>
                      </form>
                    </div>
                    <form
                      action={deleteExtensionListing}
                      onSubmit={(e) => {
                        if (
                          !window.confirm(
                            `Permanently delete “${listing.name}”? This removes the listing, comments, votes, reports, and version history. This cannot be undone.`,
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                      className="border-t border-zinc-100 bg-zinc-50/90 px-5 py-4 sm:px-6"
                    >
                      <input type="hidden" name="_tab" value="queue" />
                      <input type="hidden" name="id" value={listing.id} />
                      <p className="text-xs font-medium text-zinc-600">
                        Spam or duplicate submission? Remove it entirely from the database.
                      </p>
                      <button
                        type="submit"
                        className="mt-2 text-sm font-semibold text-red-700 underline-offset-2 hover:text-red-900 hover:underline"
                      >
                        Delete listing permanently
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {section === "featured" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                {approvedForFeatured.length} approved extension{approvedForFeatured.length === 1 ? "" : "s"}. Set order{" "}
                <span className="font-medium text-zinc-800">1–99</span>; leave empty + remove to drop from featured.
              </p>
              <input
                type="search"
                value={featuredQuery}
                onChange={(e) => setFeaturedQuery(e.target.value)}
                placeholder="Filter by name or category…"
                className="w-full max-w-sm rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 sm:w-72"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">Extension</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Slot</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredFeatured.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-zinc-500">
                          No rows match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredFeatured.map((row) => (
                        <tr key={row.id} className="transition hover:bg-zinc-50/80">
                          <td className="px-4 py-3">
                            <Link href={extensionListingHref({ id: row.id, slug: row.slug })} className="font-semibold text-zinc-900 hover:text-orange-600">
                              {row.name}
                            </Link>
                            {row.is_platform_curated ? (
                              <span className="ml-2 align-middle rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                                Curated
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{row.category}</td>
                          <td className="px-4 py-3 tabular-nums text-zinc-600">
                            {row.featured_order != null ? `#${row.featured_order}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <form action={updateFeaturedOrder} className="flex items-center gap-2">
                                <input type="hidden" name="_tab" value="featured" />
                                <input type="hidden" name="id" value={row.id} />
                                <input
                                  name="featuredOrder"
                                  type="number"
                                  min={1}
                                  max={99}
                                  placeholder="#"
                                  defaultValue={row.featured_order ?? ""}
                                  className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm tabular-nums"
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
                                >
                                  Save
                                </button>
                              </form>
                              <form action={updateFeaturedOrder}>
                                <input type="hidden" name="_tab" value="featured" />
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="featuredOrder" value="" />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                >
                                  Remove
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {section === "catalog" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <strong className="font-semibold">Submitter location</strong> is filled automatically when someone submits from
              production (Vercel / Cloudflare-style headers). Local development usually shows “not captured.”
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                {filteredCatalog.length} of {catalog.length} listings shown (pending, approved, rejected — up to 5,000 per
                status). Click <strong>Edit</strong> on a row to open the form; only one row stays open at a time.
              </p>
              <input
                type="search"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Search name, category, status, country…"
                className="w-full max-w-sm rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 sm:w-80"
              />
            </div>
            <div className="space-y-4">
              {filteredCatalog.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center text-sm text-zinc-500">
                  No listings match your search.
                </div>
              ) : (
                filteredCatalog.map((row) => {
                  const catalogOpen = openCatalogId === row.id;
                  return (
                  <article
                    key={row.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-100"
                  >
                    <div
                      className={`flex flex-col gap-3 bg-zinc-50/80 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 ${
                        catalogOpen ? "border-b border-zinc-100" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-zinc-900">{row.name}</h3>
                          <StatusDot status={row.status} />
                          {row.featured_placement_requested &&
                          (row.status === "pending" || row.featured_order == null) ? (
                            <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-900">
                              {row.status === "pending" ? "Featured requested" : "Featured: set order"}
                            </span>
                          ) : null}
                          {row.owner_id == null || row.is_platform_curated ? (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                              Platform curated
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {ownerLabel(row.profiles)} · Updated {formatShortDate(row.updated_at)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-zinc-600">
                          <span className="text-zinc-400">Listed from:</span> {geoSummary(row)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <button
                          type="button"
                          onClick={() => setOpenCatalogId(catalogOpen ? null : row.id)}
                          className="rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                        >
                          {catalogOpen ? "Close" : "Edit"}
                        </button>
                        <Link
                          href={extensionListingHref({ id: row.id, slug: row.slug })}
                          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Public page →
                        </Link>
                        <form
                          action={deleteExtensionListing}
                          onSubmit={(e) => {
                            if (
                              !window.confirm(
                                `Permanently delete “${row.name}”? This removes the listing, comments, votes, reports, and version history. This cannot be undone.`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                          className="contents"
                        >
                          <input type="hidden" name="_tab" value="catalog" />
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            className="text-sm font-semibold text-red-700 underline-offset-2 hover:text-red-900 hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    {catalogOpen ? (
                    <div className="px-5 py-5 sm:px-6">
                      <form action={adminUpdateListing} className="space-y-4">
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="_tab" value="catalog" />
                        <input type="hidden" name="ownerId" value={row.owner_id ?? ""} />
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</label>
                            <input
                              name="name"
                              required
                              minLength={2}
                              defaultValue={row.name}
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Extension ID</label>
                            <input
                              name="extensionId"
                              required
                              minLength={2}
                              maxLength={128}
                              defaultValue={row.extension_id}
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                          <div className="lg:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Category</label>
                            <select
                              name="category"
                              defaultValue={row.category}
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            >
                              {!CATEGORIES.includes(row.category as (typeof CATEGORIES)[number]) ? (
                                <option value={row.category}>{row.category} (current — not in taxonomy)</option>
                              ) : null}
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform</label>
                            <select
                              name="storePlatform"
                              required
                              defaultValue={parseStorePlatform(row.store_platform)}
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            >
                              {STORE_PLATFORM_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Owner username</label>
                            <input
                              name="ownerUsername"
                              defaultValue={(Array.isArray(row.profiles) ? row.profiles[0]?.username : row.profiles?.username) ?? ""}
                              placeholder="lowercase username or empty"
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Owner email</label>
                            <input
                              name="ownerEmail"
                              type="email"
                              defaultValue={(Array.isArray(row.profiles) ? row.profiles[0]?.email : row.profiles?.email) ?? ""}
                              required
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</label>
                          <textarea
                            name="description"
                            required
                            rows={4}
                            defaultValue={row.description}
                            className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                        <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 p-4">
                          <label className="text-xs font-semibold uppercase tracking-wide text-orange-900">
                            Featured order (homepage)
                          </label>
                          <p className="mt-1 text-xs text-orange-900/80">
                            Enter <strong>1–99</strong> to feature (e.g. paid placements). Leave empty and save to remove from
                            featured.
                          </p>
                          <input
                            name="featuredOrder"
                            type="number"
                            min={1}
                            max={99}
                            placeholder="Empty = not featured"
                            defaultValue={row.featured_order ?? ""}
                            className="mt-2 w-full max-w-xs rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-orange-500/30 sm:w-48"
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                        >
                          Save listing changes
                        </button>
                      </form>
                    </div>
                    ) : null}
                  </article>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {section === "analytics" ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Approved listings only. Views and store clicks are counted from the public extension page (best-effort; may
              exclude bots).
            </p>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">#</th>
                      <th className="px-4 py-3.5">Extension</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Views</th>
                      <th className="px-4 py-3.5">Store clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {topPerformers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                          No analytics yet. Traffic appears after listings are approved and visited.
                        </td>
                      </tr>
                    ) : (
                      topPerformers.map((row, i) => (
                        <tr key={row.id} className="hover:bg-zinc-50/80">
                          <td className="px-4 py-3 tabular-nums text-zinc-500">{i + 1}</td>
                          <td className="px-4 py-3">
                            <Link href={extensionListingHref({ id: row.id, slug: row.slug })} className="font-semibold text-zinc-900 hover:text-orange-600">
                              {row.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{row.category}</td>
                          <td className="px-4 py-3 tabular-nums font-medium text-zinc-800">
                            {(row.view_count ?? 0).toLocaleString("en-US")}
                          </td>
                          <td className="px-4 py-3 tabular-nums font-medium text-zinc-800">
                            {(row.store_click_count ?? 0).toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {section === "reports" ? (
          <div className="space-y-4">
            {openReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center text-sm text-zinc-500">
                No open reports.
              </div>
            ) : (
              openReports.map((r) => (
                <article key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{formatShortDate(r.created_at)}</p>
                      <p className="mt-1 font-semibold text-zinc-900">{r.reason}</p>
                      {r.details ? <p className="mt-2 text-sm text-zinc-600">{r.details}</p> : null}
                      <Link href={`/extensions/${r.listing_id}`} className="mt-2 inline-block text-sm font-semibold text-orange-600">
                        Open listing →
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={updateReportStatus}>
                        <input type="hidden" name="_tab" value="reports" />
                        <input type="hidden" name="reportId" value={r.id} />
                        <input type="hidden" name="status" value="reviewed" />
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Mark reviewed
                        </button>
                      </form>
                      <form action={updateReportStatus}>
                        <input type="hidden" name="_tab" value="reports" />
                        <input type="hidden" name="reportId" value={r.id} />
                        <input type="hidden" name="status" value="dismissed" />
                        <button
                          type="submit"
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          Dismiss
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {section === "history" ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Each row is a snapshot before an edit. Compare <code className="rounded bg-zinc-100 px-1">snapshot</code> fields
              in Supabase for full detail.
            </p>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50">
                    <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">When</th>
                      <th className="px-4 py-3.5">Listing</th>
                      <th className="px-4 py-3.5">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recentVersions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-zinc-500">
                          No versions yet. Edits to pending listings (or admin saves) create history entries.
                        </td>
                      </tr>
                    ) : (
                      recentVersions.map((v) => {
                        const snap = v.snapshot as Record<string, unknown>;
                        const title = String(snap.name ?? "—");
                        const ext = String(snap.extension_id ?? "—");
                        return (
                          <tr key={v.id} className="align-top">
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatShortDate(v.created_at)}</td>
                            <td className="px-4 py-3">
                              <Link href={`/extensions/${v.listing_id}`} className="font-medium text-orange-700 hover:underline">
                                {versionListingName(v)}
                              </Link>
                              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{v.listing_id.slice(0, 8)}…</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-700">
                              <span className="font-semibold">{title}</span>
                              <span className="block text-zinc-500">ID: {ext}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {section === "blog" ? (
          superAdmin ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-600">
                  {blogPosts.length} post{blogPosts.length === 1 ? "" : "s"}. Drafts stay hidden until you publish.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpenBlogId(null);
                    setShowNewBlog((v) => !v);
                  }}
                  className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                >
                  {showNewBlog ? "Close composer" : "New article"}
                </button>
              </div>

              {showNewBlog ? (
                <form
                  action={createBlogPost}
                  className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <input type="hidden" name="_tab" value="blog" />
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700">New post</p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</label>
                      <input name="title" required className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Slug (optional)</label>
                      <input
                        name="slug"
                        placeholder="auto from title if empty"
                        className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
                        <input type="checkbox" name="published" value="true" className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500" />
                        Published (visible on /blog)
                      </label>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Excerpt</label>
                      <textarea name="excerpt" rows={2} className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Body</label>
                      <p className="mt-1 text-xs text-zinc-500">
                        Rich toolbar (headings, lists, links, code…) — stored as Markdown for the public blog.
                      </p>
                      <BlogBodyEditor key="blog-new" defaultValue="" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Meta title</label>
                      <input name="meta_title" className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Meta description</label>
                      <input name="meta_description" className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Canonical URL</label>
                      <input
                        name="canonical_url"
                        placeholder="Leave empty for default, or https://… or /path"
                        className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cover image URL</label>
                      <input name="cover_image_url" type="url" placeholder="https://…" className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                  >
                    Create post
                  </button>
                </form>
              ) : null}

              <div className="space-y-4">
                {blogPosts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
                    No posts yet. Use &quot;New article&quot; to compose.
                  </p>
                ) : (
                  blogPosts.map((row) => {
                    const open = openBlogId === row.id;
                    return (
                      <article key={row.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-zinc-900">{row.title}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  row.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {row.published ? "Live" : "Draft"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs text-zinc-500">/{row.slug}</p>
                            <p className="mt-1 text-xs text-zinc-500">Updated {formatShortDate(row.updated_at)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {row.published ? (
                              <Link
                                href={`/blog/${row.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View →
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewBlog(false);
                                setOpenBlogId(open ? null : row.id);
                              }}
                              className="rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
                            >
                              {open ? "Close" : "Edit"}
                            </button>
                            <form
                              action={deleteBlogPost}
                              onSubmit={(e) => {
                                if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) e.preventDefault();
                              }}
                            >
                              <input type="hidden" name="_tab" value="blog" />
                              <input type="hidden" name="id" value={row.id} />
                              <button
                                type="submit"
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>
                        {open ? (
                          <form
                            key={row.id}
                            action={updateBlogPost}
                            className="space-y-4 p-5 sm:p-6"
                          >
                            <input type="hidden" name="_tab" value="blog" />
                            <input type="hidden" name="id" value={row.id} />
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</label>
                                <input
                                  name="title"
                                  required
                                  defaultValue={row.title}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Slug</label>
                                <input
                                  name="slug"
                                  defaultValue={row.slug}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div className="flex items-end pb-1">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
                                  <input
                                    type="checkbox"
                                    name="published"
                                    value="true"
                                    defaultChecked={row.published}
                                    className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  Published
                                </label>
                              </div>
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Excerpt</label>
                                <textarea
                                  name="excerpt"
                                  rows={2}
                                  defaultValue={row.excerpt ?? ""}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Body</label>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Rich toolbar — stored as Markdown for the public blog.
                                </p>
                                <BlogBodyEditor key={row.id} defaultValue={row.body} />
                              </div>
                              <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Meta title</label>
                                <input
                                  name="meta_title"
                                  defaultValue={row.meta_title ?? ""}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Meta description</label>
                                <input
                                  name="meta_description"
                                  defaultValue={row.meta_description ?? ""}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Canonical URL</label>
                                <input
                                  name="canonical_url"
                                  defaultValue={row.canonical_url ?? ""}
                                  placeholder="https://… or /path"
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cover image URL</label>
                                <input
                                  name="cover_image_url"
                                  type="url"
                                  defaultValue={row.cover_image_url ?? ""}
                                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                            >
                              Save changes
                            </button>
                          </form>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">The blog tab is only available to super admins.</p>
          )
        ) : null}

        {section === "comments" ? (
          <div className="space-y-4">
            {sortedBlogComments.length === 0 ? (
              <p className="text-sm text-zinc-600">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {sortedBlogComments.map((row) => {
                  const { title: postTitle, slug: postSlug } = blogCommentPostMeta(row);
                  const isEditing = editingCommentId === row.id;
                  return (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <StatusDot status={row.status} />
                          <p className="mt-2 text-sm font-semibold text-zinc-900">
                            <Link href={`/blog/${postSlug}`} className="hover:text-orange-600">
                              {postTitle}
                            </Link>
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{formatShortDate(row.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {row.status === "pending" && !isEditing ? (
                            <>
                              <form action={moderateBlogComment}>
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="status" value="approved" />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              </form>
                              <form action={moderateBlogComment}>
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="status" value="rejected" />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </form>
                            </>
                          ) : null}
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(row.id)}
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                            >
                              Edit
                            </button>
                          ) : null}
                          {!isEditing ? <AdminBlogCommentDeleteForm commentId={row.id} /> : null}
                        </div>
                      </div>

                      {isEditing ? (
                        <form action={updateBlogCommentAdmin} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                          <input type="hidden" name="id" value={row.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Name</label>
                              <input
                                name="author_name"
                                defaultValue={row.author_name}
                                required
                                maxLength={200}
                                className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</label>
                              <input
                                name="author_email"
                                type="email"
                                defaultValue={row.author_email}
                                required
                                maxLength={320}
                                className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Website (optional)</label>
                            <input
                              name="website_url"
                              type="url"
                              defaultValue={row.website_url ?? ""}
                              placeholder="https://"
                              maxLength={500}
                              className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Comment</label>
                            <textarea
                              name="body"
                              defaultValue={row.body}
                              required
                              rows={5}
                              maxLength={8000}
                              className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</label>
                            <select
                              name="status"
                              defaultValue={row.status}
                              className="mt-1.5 w-full max-w-xs rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="submit"
                              className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700"
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="rounded-xl border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="mt-3 text-sm font-bold text-zinc-800">{row.author_name}</p>
                          <p className="mt-0.5 font-mono text-xs text-zinc-500">{row.author_email}</p>
                          {row.website_url ? (
                            <p className="mt-1 text-xs">
                              <a
                                href={row.website_url}
                                className="font-semibold text-orange-600 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {row.website_url}
                              </a>
                            </p>
                          ) : null}
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{row.body}</p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {section === "people" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                Showing {filteredUsers.length} of {users.length} loaded profiles.
                {!superAdmin ? " Ban / Unban requires super admin." : null}
              </p>
              <input
                type="search"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search email, username, role…"
                className="w-full max-w-sm rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 sm:w-72"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Username</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Joined</th>
                      <th className="px-4 py-3.5 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredUsers.map((profile) => (
                      <tr key={profile.id} className="transition hover:bg-zinc-50/80">
                        <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-800">{profile.email}</td>
                        <td className="px-4 py-3 text-zinc-700">{profile.username || "—"}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={profile.role} />
                        </td>
                        <td className="px-4 py-3">
                          {profile.is_banned ? (
                            <span className="text-xs font-semibold text-red-600">Banned</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600">Active</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                          {formatShortDate(profile.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {superAdmin ? (
                            <form action={toggleBan}>
                              <input type="hidden" name="_tab" value="people" />
                              <input type="hidden" name="userId" value={profile.id} />
                              <input type="hidden" name="isBanned" value={String(!profile.is_banned)} />
                              <button
                                type="submit"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  profile.is_banned
                                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                    : "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                                }`}
                              >
                                {profile.is_banned ? "Unban" : "Ban"}
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
