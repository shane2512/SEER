/**
 * The title block shared by the app surfaces.
 *
 * Both the dashboard and the trade history previously opened with a bare
 * `h1` on a heavy 2px bottom border and nothing else, which gave a data-dense
 * screen no orientation — the title said where you were but not what the
 * screen was for. A one-line description costs almost nothing vertically and
 * does most of the work of making a dense view legible on first arrival.
 */
export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-9">
      <h1 className="font-display text-[32px] leading-10 font-bold tracking-[-0.03em] text-text-bright">
        {title}
      </h1>
      <p className="mt-2 max-w-[62ch] font-mono text-[14px] leading-6 text-text-dim">{description}</p>
    </div>
  );
}
