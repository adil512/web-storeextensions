import { NextResponse } from "next/server";
import { requireRole, requireAuth } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "super_admin"]);
  const { supabase, user } = await requireAuth();
  const { id } = await context.params;
  const body = await request.json();

  const { error } = await supabase
    .from("extension_listings")
    .update({
      status: body.status,
      review_notes: body.reviewNotes ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
