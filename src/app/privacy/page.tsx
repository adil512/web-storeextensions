import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageHero, ContentPageMain, ContentSection } from "@/components/content-page";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Browser Extension Marketplace",
    description:
      "Read our privacy policy to understand how we collect, use, and protect your data when you use our browser extension marketplace, including account and listing information.",
    alternates: { canonical: await canonicalUrl("/privacy") },
  };
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <ContentPageHero
        title="Privacy"
        subtitle="This policy describes how information is collected, used, and protected in connection with the directory and related services."
      />
      <ContentPageMain>
        <ContentSection title="Scope">
          <p>
            It applies to visitors, registered users, and makers who submit extensions to {SITE_NAME}. By using the site,
            you agree to this policy together with the{" "}
            <Link href="/terms" className="font-medium text-orange-600 hover:text-orange-700">
              Terms of Service
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Information we collect">
          <p>
            <span className="font-medium text-zinc-800">Account data:</span> When you register, we process identifiers
            such as email address, password hash (handled by the authentication provider), and profile fields you choose
            (for example display name, username, bio, and links).
          </p>
          <p>
            <span className="font-medium text-zinc-800">Listing and content data:</span> Submissions include text,
            metadata, and URLs you provide for extensions. Community posts and comments are stored with your account
            association.
          </p>
          <p>
            <span className="font-medium text-zinc-800">Technical data:</span> Standard server and application logs may
            include IP address, device and browser type, timestamps, and pages requested, used for security and
            reliability.
          </p>
        </ContentSection>

        <ContentSection title="How we use information">
          <p>
            We use data to operate and improve the directory, authenticate users, moderate content, communicate about your
            account or listings where appropriate, comply with law, and protect the service and its users.
          </p>
        </ContentSection>

        <ContentSection title="Storage and processors">
          <p>
            Data is stored with infrastructure and database providers (for example Supabase and hosting used for this
            deployment). Those providers process data under their agreements and security practices. We do not sell your
            personal information.
          </p>
        </ContentSection>

        <ContentSection title="Cookies and sessions">
          <p>
            Session cookies or similar technologies keep you signed in. You can clear cookies through your browser; doing
            so may require you to sign in again.
          </p>
        </ContentSection>

        <ContentSection title="Retention">
          <p>
            We retain information for as long as your account exists, as needed to provide the service, or as required for
            legal, dispute, or safety purposes. Some data may remain in backups for a limited period after deletion.
          </p>
        </ContentSection>

        <ContentSection title="Your choices">
          <p>
            You may update certain profile fields in{" "}
            <Link href="/account" className="font-medium text-orange-600 hover:text-orange-700">
              Account settings
            </Link>
            . To exercise other rights (such as access or deletion) where applicable, contact us through{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-700">
              Contact
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Changes">
          <p>
            We may update this policy from time to time. The revised version will be posted on this page with an updated
            effective date when we adopt that practice.
          </p>
        </ContentSection>

        <p className="text-xs text-zinc-500">Effective: March 2026</p>
      </ContentPageMain>
    </div>
  );
}
