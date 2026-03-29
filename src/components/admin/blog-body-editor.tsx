"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  /** Form field name (default `body`). */
  name?: string;
  /** Initial markdown when the editor mounts or when `defaultValue` changes (e.g. switching posts). */
  defaultValue?: string;
};

/**
 * Markdown editor with toolbar (headings, bold, lists, links, code, etc.) for admin blog forms.
 * Syncs to a real `<textarea name="body">` so server actions receive the value on submit.
 */
export function BlogBodyEditor({ name = "body", defaultValue = "" }: Props) {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    setVal(defaultValue);
  }, [defaultValue]);

  return (
    <div className="w-full" data-color-mode="light">
      <div className="mt-1.5 overflow-hidden rounded-xl border border-zinc-300 bg-white focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/20 [&_.w-md-editor]:!shadow-none [&_.w-md-editor]:rounded-xl [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-zinc-200 [&_.w-md-editor-toolbar]:bg-zinc-50">
        <MDEditor
          value={val}
          onChange={(v) => setVal(v ?? "")}
          height={420}
          visibleDragbar={false}
          preview="live"
          textareaProps={{
            placeholder: "Write your post… Use the toolbar for headings, bold, lists, links, quotes, and code.",
          }}
        />
      </div>
      {/* Submitted with the form; visually hidden but not display:none so values serialize reliably. */}
      <textarea
        name={name}
        value={val}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-10 h-px w-px opacity-0"
      />
    </div>
  );
}
