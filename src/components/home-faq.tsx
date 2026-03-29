const FAQ_ITEMS = [
  {
    q: "How do I list my browser extension?",
    a: "Create a free account, complete your public profile, then submit your extension with the required details. Our team reviews every listing before it goes live.",
  },
  {
    q: "Which browsers are supported?",
    a: "We welcome extensions built for Chrome, Firefox, Edge, Brave, and other Chromium-based browsers. You can include your official store link when you submit.",
  },
  {
    q: "How long does review take?",
    a: "Review time varies by queue. You can track status from your dashboard. You will receive visibility once your listing is approved.",
  },
  {
    q: "Is submission free?",
    a: "Yes—submitting a listing is free. Featured placement may be managed by admins to highlight quality extensions.",
  },
  {
    q: "Can I update my profile and links?",
    a: "Yes. From your account you can update your username, bio, website, and social links. Your public page lives at /u/yourusername.",
  },
];

export default function HomeFaq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20" id="faq">
      <h4 className="text-center text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">FAQ</h4>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-600">
        Everything you need to know about getting listed and discovered.
      </p>
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
