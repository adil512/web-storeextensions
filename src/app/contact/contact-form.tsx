"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitContactMessage, type ContactFormState } from "@/app/contact/actions";

const initial: ContactFormState = { ok: false };

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(submitContactMessage, initial);

  if (state.ok) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-10 text-center shadow-sm sm:px-8">
          <p className="text-lg font-semibold text-emerald-950">Message received</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
            We will review your inquiry and respond when appropriate.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            Send another message
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">
          <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
            Pricing
          </Link>
          {" · "}
          <Link href="/account" className="font-medium text-orange-600 hover:text-orange-700">
            Account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {state.error ? (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 shadow-sm">
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_16px_48px_-28px_rgba(0,0,0,0.12)] sm:p-8">
        <div>
          <label htmlFor="contact-name" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={200}
            autoComplete="name"
            defaultValue={defaultName}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            defaultValue={defaultEmail}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label htmlFor="contact-body" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Message
          </label>
          <textarea
            id="contact-body"
            name="body"
            required
            rows={7}
            maxLength={10000}
            minLength={10}
            placeholder="Describe your question or request…"
            className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
          />
          <p className="mt-1 text-xs text-zinc-400">Minimum 10 characters.</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-zinc-500">
        For plan details see{" "}
        <Link href="/pricing" className="font-medium text-orange-600 hover:text-orange-700">
          Pricing
        </Link>
        . Account settings:{" "}
        <Link href="/account" className="font-medium text-orange-600 hover:text-orange-700">
          Account
        </Link>
        .
      </p>
    </div>
  );
}
