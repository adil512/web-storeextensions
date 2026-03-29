import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/profile-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * After staff sign-in (email or OAuth), ensures the user has admin/super_admin before /admin.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login?error=session", origin));
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (!profile || !isAdminRole(profile.role)) {
    return NextResponse.redirect(new URL("/admin/login?error=forbidden", origin));
  }

  return NextResponse.redirect(new URL("/admin", origin));
}
