import type { Metadata } from "next";
import { ContactForm } from "@/app/contact/contact-form";
import { ContentPageHero, ContentPageMain } from "@/components/content-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: `Contact · ${SITE_NAME}`,
  description: `Get in touch with our team for support, feedback, or partnership inquiries. We're here to help with your browser extensions, submissions, and account questions on ${SITE_NAME}.`,
  alternates: { canonical: canonicalUrl("/contact") },
};

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaultName = "";
  let defaultEmail = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email,username")
      .eq("id", user.id)
      .maybeSingle();
    defaultName = (profile?.full_name?.trim() || profile?.username || "").trim();
    defaultEmail = (profile?.email || user.email || "").trim();
  }

  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <ContentPageHero
        title="Contact"
        subtitle="Submit the form below. Messages are stored securely and reviewed by the team."
      />
      <ContentPageMain>
        <ContactForm defaultName={defaultName} defaultEmail={defaultEmail} />
      </ContentPageMain>
    </div>
  );
}
