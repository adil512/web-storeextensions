export type UserRole = "user" | "admin" | "super_admin";
export type ListingStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

export type ExtensionListing = {
  id: string;
  owner_id: string | null;
  is_platform_curated?: boolean;
  featured_order?: number | null;
  name: string;
  description: string;
  category: string;
  current_users: number;
  uninstalls_last_30_days: number;
  users_by_region: Record<string, number>;
  languages: string[];
  homepage_url: string | null;
  store_url: string | null;
  logo_url: string | null;
  extension_id?: string;
  view_count?: number;
  store_click_count?: number;
  listing_country?: string | null;
  listing_region?: string | null;
  listing_city?: string | null;
  status: ListingStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
