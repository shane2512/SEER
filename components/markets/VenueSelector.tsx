"use client";

/**
 * A row of venue-filter pills. Renders nothing when there's zero or one
 * discovered venue — a selector with no real choice is noise, not a control
 * (CLAUDE.md: avoid decorative components with no information value).
 */
export function VenueSelector({
  venueIds,
  selected,
  onSelect,
}: {
  venueIds: string[];
  selected: string | undefined;
  onSelect: (venueId: string | undefined) => void;
}) {
  if (venueIds.length < 2) return null;

  return (
    <div className="flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
      <button
        onClick={() => onSelect(undefined)}
        className={`border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${
          selected === undefined ? "border-border-hard bg-border-hard text-surface-base" : "border-border-dim text-text-dim hover:border-border-hard hover:text-text-bright"
        }`}
      >
        All Venues
      </button>
      {venueIds.map((venueId) => (
        <button
          key={venueId}
          onClick={() => onSelect(venueId)}
          className={`border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard ${
            selected === venueId ? "border-border-hard bg-border-hard text-surface-base" : "border-border-dim text-text-dim hover:border-border-hard hover:text-text-bright"
          }`}
        >
          {venueId}
        </button>
      ))}
    </div>
  );
}
