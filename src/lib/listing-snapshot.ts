export function snapshotFromListingRow(row: Record<string, unknown>) {
  return {
    name: row.name,
    description: row.description,
    category: row.category,
    extension_id: row.extension_id,
    slug: row.slug,
    store_platform: row.store_platform,
    store_url: row.store_url,
    homepage_url: row.homepage_url,
    logo_url: row.logo_url,
    languages: row.languages,
    current_users: row.current_users,
    uninstalls_last_30_days: row.uninstalls_last_30_days,
    users_by_region: row.users_by_region,
    featured_order: row.featured_order,
    featured_placement_requested: row.featured_placement_requested,
    listed_for_sale: row.listed_for_sale,
  };
}
