import Link from "next/link";
import type { ReactNode } from "react";

const FAQ_ITEMS: { q: string; a: ReactNode }[] = [
  {
    q: "How do I list my browser extension on WebstoreExtensions?",
    a: "You can list your browser extension by submitting your extension details through our submission form. Provide your extension name, description, official store link (Chrome Web Store, Firefox Add-ons, etc.), category, and relevant screenshots. Once submitted, our team reviews and publishes your listing.",
  },
  {
    q: "What information is required to submit an extension?",
    a: "To submit successfully, include extension name, short and detailed description, price, official extension store URL, category, and recommended screenshots or logo. Complete and accurate information improves approval chances and visibility.",
  },
  {
    q: "Is submission free or paid?",
    a: (
      <>
        Basic submission is completely free. If you want featured exposure and selling-focused visibility, check our{" "}
        <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
          Pricing
        </Link>{" "}
        plans.
      </>
    ),
  },
  {
    q: "Can I list extensions from multiple browsers?",
    a: "Yes, you can submit extensions from multiple browsers as long as they are officially published on supported stores like Chrome, Firefox, Edge, or others.",
  },
  {
    q: "Which browsers are supported for extension listings?",
    a: "We support extensions from major browsers, including Google Chrome, Mozilla Firefox, Microsoft Edge, Brave Browser, and Opera.",
  },
  {
    q: "Can I submit a Chrome extension only?",
    a: "No, you can list both extensions and themes as long as they are already published on the Chrome Web Store.",
  },
  {
    q: "How long does the review process take?",
    a: "Most submissions are reviewed within 24–72 hours. It may take longer during peak times or if additional verification is required.",
  },
  {
    q: "Why was my extension not approved?",
    a: "Common reasons include invalid or broken links, incomplete or misleading content, policy violations, harmful features, or duplicate submissions. Ensure all information is accurate and compliant.",
  },
  {
    q: "Do you manually review submissions?",
    a: "Yes, every submission is manually reviewed to ensure quality, accuracy, and trustworthiness for users.",
  },
  {
    q: "Can I update my extension listing after submission?",
    a: "Yes, you can request updates at any time. You have full control in your dashboard where you can edit, update, or remove your submissions.",
  },
  {
    q: "Can I add new features or screenshots later?",
    a: "Yes, you can update your listing with new screenshots, features, or descriptions anytime to keep it current and optimized.",
  },
  {
    q: "How can I improve my extension’s visibility?",
    a: "Use a clear keyword-rich description, add high-quality screenshots, choose the correct category, and keep your listing updated. Optimized listings perform better and attract more users.",
  },
  {
    q: "Do you offer featured or promoted listings?",
    a: (
      <>
        Yes, this is one of our key features. Check the{" "}
        <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
          Pricing
        </Link>{" "}
        page for details. Once payment is confirmed, featured placement is added quickly.
      </>
    ),
  },
  {
    q: "Is WebstoreExtensions affiliated with browser stores?",
    a: "No, WebstoreExtensions is an independent platform and is not officially affiliated with Google, Mozilla, Microsoft, or any browser vendors.",
  },
  {
    q: "Can I list private or unpublished extensions?",
    a: "No, only publicly available extensions from official browser stores are allowed.",
  },
  {
    q: "Is there a limit on how many extensions I can submit?",
    a: "There is no strict limit, but all submissions must be unique and comply with our quality guidelines.",
  },
  {
    q: "How do users access my extension?",
    a: "Users can open your listing and then click through to the official browser store page to install your extension.",
  },
];

export default function HomeFaq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20" id="faq">
      <h4 className="text-center text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">FAQ</h4>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-600">Everything you need to know about listing and growth.</p>
      <div className="mt-10 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-zinc-200 bg-white px-5 py-1 shadow-sm open:border-orange-200/80 open:shadow-md open:ring-1 open:ring-orange-100"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition group-open:rotate-45 group-open:border-orange-200 group-open:bg-orange-50 group-open:text-orange-600">
                +
              </span>
            </summary>
            <p className="border-t border-zinc-100 pb-4 pt-3 text-sm leading-relaxed text-zinc-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
