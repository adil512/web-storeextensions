function IconChrome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C8.4 2 5.2 3.6 3.3 6.1l3.8 6.6a4.5 4.5 0 019.7 0l3.8-6.6C18.8 3.6 15.6 2 12 2zM2.5 8.4A9.99 9.99 0 002 12c0 4 2.4 7.4 5.9 9l3.8-6.6a4.52 4.52 0 010-5.9L2.5 8.4zm19 0l-3.8 6.5a4.52 4.52 0 010 5.9l3.8 6.6A9.99 9.99 0 0022 12c0-1.3-.2-2.5-.5-3.6zM12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function IconFirefox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.2c-.8 0-1.6.1-2.4.3 1.1 1.4 1.8 3.2 1.8 5.1 0 2.8-1.5 5.3-3.8 6.7.9.7 2 1.1 3.2 1.1 3.2 0 5.8-2.6 5.8-5.8 0-2.6-1.7-4.8-4.1-5.6-.2-.6-.4-1.2-.7-1.8zM6.8 4.5C4.5 6.3 3 9 3 12c0 3.7 2.3 6.9 5.5 8.2-.3-.8-.5-1.7-.5-2.6 0-2.9 1.7-5.4 4.2-6.6-1.2-1.4-1.9-3.2-1.9-5.2 0-1.2.2-2.3.7-3.3-.8.5-1.5 1.1-2.2 1.8zm8.4-.8c2.8 1 4.8 3.7 4.8 6.8 0 1.1-.2 2.1-.7 3 2.5-1.3 4.2-3.9 4.2-6.9 0-1.5-.4-2.9-1.1-4.1-.8 0-1.5.4-2 .8-.4-.2-.8-.4-1.2-.6z" />
    </svg>
  );
}

function IconEdge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M4 7.5h11a5 5 0 010 10H4v-2.5h11a2.5 2.5 0 000-5H4V7.5z" />
    </svg>
  );
}

function IconBrave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l7 3v7c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V5l7-3zm0 4.2L8.2 8v5.2c0 3 2.2 5.8 3.8 6.5 1.6-.7 3.8-3.5 3.8-6.5V8L12 6.2z" />
    </svg>
  );
}

const BROWSERS = [
  { name: "Chrome", Icon: IconChrome },
  { name: "Firefox", Icon: IconFirefox },
  { name: "Edge", Icon: IconEdge },
  { name: "Brave", Icon: IconBrave },
] as const;

export default function HeroBrowserRow() {
  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <p className="text-center text-sm font-medium text-zinc-600">Compatible with all major browsers</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
        {BROWSERS.map(({ name, Icon }) => (
          <div key={name} className="flex items-center gap-2.5 text-zinc-700">
            <Icon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <span className="text-sm font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
