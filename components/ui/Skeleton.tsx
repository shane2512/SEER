/**
 * Placeholder geometry shown while live DreamDEX market data is in flight.
 *
 * These mirror the real card shapes rather than being generic grey bars,
 * because the point is to hold the layout: the dashboard used to render a
 * single line of text while loading and then reflow completely once markets
 * arrived, which reads as a broken page rather than a loading one.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

/** A stand-in for one Level 1 clay card, matching its radius and border. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-border-layer bg-surface-layer p-5 ${className}`} aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-5 h-8 w-2/3" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
