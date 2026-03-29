import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireRole(["super_admin"]);
  const { id } = await context.params;
  const body = await request.json();
  const { supabase } = await requireAuth();

  const { error } = await supabase.from("profiles").update({ is_banned: !!body.isBanned }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
