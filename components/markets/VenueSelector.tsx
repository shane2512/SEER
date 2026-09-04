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
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(undefined)}
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          selected === undefined ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        All venues
      </button>
      {venueIds.map((venueId) => (
        <button
          key={venueId}
          onClick={() => onSelect(venueId)}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            selected === venueId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {venueId}
        </button>
      ))}
    </div>
  );
}
