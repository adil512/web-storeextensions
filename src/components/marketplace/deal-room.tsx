"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type DealMessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_username: string | null;
};

type Props = {
  inquiryId: string;
  messages: DealMessageRow[];
  currentUserId: string;
  buyerId: string;
  inquiryOpen: boolean;
  initialMessage: string;
  offerHint: string | null;
};

export function DealRoom({
  inquiryId,
  messages,
  currentUserId,
  buyerId,
  inquiryOpen,
  initialMessage,
  offerHint,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(inquiryOpen);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const text = body.trim();
    if (!text || !open) return;
    setSending(true);
    const res = await fetch(`/api/inquiries/${inquiryId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not send.");
      return;
    }
    setBody("");
    router.refresh();
  };

  const onClose = async () => {
    if (!open || !window.confirm("Close this thread? You can still read it, but no new messages.")) return;
    setClosing(true);
    setError(null);
    const res = await fetch(`/api/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    const data = await res.json().catch(() => ({}));
    setClosing(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not close.");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Original inquiry</p>
        {offerHint ? (
          <p className="mt-2 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-800">Hint: </span>
            {offerHint}
          </p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-zinc-800">{initialMessage}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-900">Messages</h2>
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.author_id === currentUserId;
            const label =
              m.author_id === buyerId ? (mine ? "You (buyer)" : "Buyer") : mine ? "You (seller)" : "Seller";
            return (
              <li
                key={m.id}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  mine ? "ml-4 border-emerald-200 bg-emerald-50/80" : "mr-4 border-zinc-200 bg-white"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {label}
                  {m.author_username ? ` · @${m.author_username}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-800">{m.body}</p>
                <p className="mt-2 text-[10px] text-zinc-400">{new Date(m.created_at).toLocaleString()}</p>
              </li>
            );
          })}
        </ul>
      </div>

      {open ? (
        <form onSubmit={(ev) => void onSend(ev)} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={8000}
            placeholder="Write a message…"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              disabled={closing}
              onClick={() => void onClose()}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {closing ? "Closing…" : "Close thread"}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">This thread is closed.</p>
      )}
    </div>
  );
}
