import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/lib/types/db";

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return { supabase, user };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { supabase, user } = await requireAuth();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data as Profile | null;
}

export async function requireRole(roles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
