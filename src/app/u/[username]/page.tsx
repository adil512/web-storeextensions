import Link from "next/link";
import { notFound } from "next/navigation";
import { extensionListingHref } from "@/lib/listing-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">{children}</span>
      {label}
    </a>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,full_name,bio,website_url,social_links,avatar_url")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const social = (profile.social_links ?? {}) as Record<string, string>;
  const facebook = social.facebook?.trim();
  const xLink = social.x?.trim() || social.twitter?.trim();
  const linkedin = social.linkedin?.trim();

  const { data: listings } = await supabase
    .from("extension_listings")
    .select("id,slug,name,description,category,current_users,store_url")
    .eq("owner_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const displayName = profile.full_name || profile.username || "Maker";
  const extCount = listings?.length ?? 0;
  const avatar = profile.avatar_url?.trim();
  const initials = (displayName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2) || profile.username?.slice(0, 2) || "?").toUpperCase();

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-zinc-100/80 via-zinc-50 to-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_24px_48px_-32px_rgba(0,0,0,0.2)]">
          <div className="h-28 bg-gradient-to-r from-orange-400/90 via-amber-400/80 to-orange-500/90 sm:h-32" />
          <div className="relative px-6 pb-8 pt-0 sm:px-10">
            <div className="-mt-14 flex flex-col gap-6 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-zinc-100 shadow-lg ring-1 ring-zinc-200/80 sm:h-32 sm:w-32">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-supplied arbitrary avatar URLs
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold tracking-tight text-zinc-500">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="text-center sm:pb-1 sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Public profile</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{displayName}</h1>
                  <p className="mt-0.5 font-mono text-sm text-zinc-500">@{profile.username}</p>
                </div>
              </div>
              <div className="flex justify-center sm:justify-end">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-zinc-900">{extCount}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Extensions</p>
                </div>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-zinc-600">{profile.bio}</p>
            ) : (
              <p className="mt-8 text-sm text-zinc-500">No bio provided.</p>
            )}

            {(profile.website_url || facebook || xLink || linkedin) && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Links</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {profile.website_url ? (
                    <SocialLink href={profile.website_url} label="Website">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </SocialLink>
                  ) : null}
                  {facebook ? (
                    <SocialLink href={facebook} label="Facebook">
                      <span className="text-xs font-bold">f</span>
                    </SocialLink>
                  ) : null}
                  {xLink ? (
                    <SocialLink href={xLink} label="X">
                      <span className="text-xs font-bold">𝕏</span>
                    </SocialLink>
                  ) : null}
                  {linkedin ? (
                    <SocialLink href={linkedin} label="LinkedIn">
                      <span className="text-xs font-bold">in</span>
                    </SocialLink>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">Extensions</h2>
              <p className="mt-1 text-sm text-zinc-500">Approved listings by this maker</p>
            </div>
          </div>

          {(listings ?? []).length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/90 bg-white px-6 py-14 text-center text-sm text-zinc-500 shadow-sm">
              No approved listings.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(listings ?? []).map((listing) => (
                <div
                  key={listing.id}
                  className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-600/90">{listing.category}</p>
                  <h3 className="mt-2 text-lg font-bold text-zinc-900">{listing.name}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-600">{listing.description}</p>
                  <p className="mt-4 text-xs font-medium text-zinc-400">{listing.current_users.toLocaleString()} users</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={extensionListingHref({ id: listing.id, slug: listing.slug })}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 sm:flex-none"
                    >
                      View listing
                    </Link>
                    {listing.store_url ? (
                      <a
                        href={listing.store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:flex-none"
                      >
                        Chrome Web Store
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
