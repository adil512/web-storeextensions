import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageHero, ContentPageMain, ContentSection } from "@/components/content-page";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Extension Marketplace Usage",
  description:
    "Review the terms and conditions for using our browser extension marketplace, including rules for submissions, listings, accounts, and community interactions.",
  alternates: { canonical: canonicalUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <ContentPageHero
        title="Terms of Service"
        subtitle={`These terms govern access to ${SITE_NAME} and related features.`}
      />
      <ContentPageMain>
        <ContentSection title="Agreement">
          <p>
            By accessing or using the site, you agree to these terms and to the{" "}
            <Link href="/privacy" className="font-medium text-orange-600 hover:text-orange-700">
              Privacy Policy
            </Link>
            . If you do not agree, do not use the service.
          </p>
        </ContentSection>

        <ContentSection title="Service">
          <p>
            {SITE_NAME} provides a moderated directory, user accounts, submissions, and related functionality. Features
            may change; availability is not guaranteed without interruption.
          </p>
        </ContentSection>

        <ContentSection title="Accounts and conduct">
          <p>
            You are responsible for account security and for content you submit. Harassment, illegal activity, malware,
            or attempts to compromise the service are prohibited. We may suspend or terminate accounts or content that
            violate these terms or harm users or the directory.
          </p>
        </ContentSection>

        <ContentSection title="Listings and moderation">
          <p>
            Submissions are reviewed before or after publication according to directory rules. Approval, rejection, or
            removal is at our discretion within applicable law. Commercial plans are described on{" "}
            <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
              Pricing
            </Link>{" "}
            and do not override safety or legal requirements.
          </p>
        </ContentSection>

        <ContentSection title="Disclaimer">
          <p>
            The directory is provided &quot;as is.&quot; We do not warrant that every listing is free of defects or
            that third-party extensions are fit for a particular purpose. Use of listed software is at your own risk.
          </p>
        </ContentSection>

        <ContentSection title="Limitation of liability">
          <p>
            To the extent permitted by law, {SITE_NAME} and its operators are not liable for indirect or consequential
            damages arising from use of the site or reliance on listings.
          </p>
        </ContentSection>

        <ContentSection title="Contact">
          <p>
            Questions about these terms may be directed through{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-700">
              Contact
            </Link>
            .
          </p>
        </ContentSection>

        <p className="text-xs text-zinc-500">Effective: March 2026</p>
      </ContentPageMain>
    </div>
  );
}
