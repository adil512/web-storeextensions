"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (name.length < 1 || name.length > 200) {
    return { ok: false, error: "Enter a valid name." };
  }
  if (!emailRe.test(email) || email.length > 320) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (subject.length < 1 || subject.length > 200) {
    return { ok: false, error: "Enter a subject." };
  }
  if (body.length < 10 || body.length > 10000) {
    return { ok: false, error: "Message must be between 10 and 10,000 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    subject,
    body,
    user_id: user?.id ?? null,
  });

  if (error) {
    const isSchema = error.code === "PGRST205" || error.message.includes("schema cache");
    return {
      ok: false,
      error: isSchema
        ? "Contact form is not available until the database migration is applied."
        : error.message,
    };
  }

  return { ok: true };
}
