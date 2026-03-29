import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageHero, ContentPageMain, ContentSection } from "@/components/content-page";
import { SITE_NAME } from "@/lib/brand";
import { canonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About Us – Browser Extension Marketplace & Community",
  description:
    "Learn about our browser extension marketplace where developers submit, list, and promote extensions for Chrome, Firefox, and Edge. Discover our mission to help users find the best tools and creators grow.",
  alternates: { canonical: canonicalUrl("/about") },
};

export default function AboutPage() {
  return (
    <div className="min-h-[50vh] bg-zinc-50">
      <ContentPageHero
        title="About"
        subtitle={`${SITE_NAME} connects people who build browser extensions with people who want to discover them.`}
      />
      <ContentPageMain>
        <ContentSection title="What we do">
          <p>
            We operate a curated directory: makers submit extensions, the team reviews submissions, and approved listings
            appear in categories, search, and maker profiles. Featured placement and commercial options are described on{" "}
            <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
              Pricing
            </Link>
            .
          </p>
        </ContentSection>
        <ContentSection title="Moderation">
          <p>
            Listings are checked for relevance, clarity, and alignment with directory rules. Decisions may include
            approval, requests for changes, or rejection. Paid tiers affect review priority and visibility, not
            exemption from policy.
          </p>
        </ContentSection>
        <ContentSection title="Community">
          <p>
            The{" "}
            <Link href="/community" className="font-medium text-orange-600 hover:text-orange-700">
              Community
            </Link>{" "}
            space is for makers to share updates in text and links. Directory listings and community posts are separate
            surfaces with their own rules.
          </p>
        </ContentSection>
        <ContentSection title="Submit">
          <p>
            Ready to list an extension?{" "}
            <Link href="/submit" className="font-medium text-orange-600 hover:text-orange-700">
              Open the submission form
            </Link>{" "}
            (sign-in required). Questions about accounts or listings are handled through{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-700">
              Contact
            </Link>
            .
          </p>
        </ContentSection>
      </ContentPageMain>
    </div>
  );
}
