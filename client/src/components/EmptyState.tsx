interface Props {
  /** True when query/tier filters are active — changes the copy and shows a clear button. */
  hasFilters: boolean;
  onClearFilters: () => void;
}

/**
 * Empty-state illustration shown when /api/patients returns 0 results
 * OR when search/filter narrows the list to nothing.
 */
export default function EmptyState({ hasFilters, onClearFilters }: Props) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Inline SVG — clipboard with a magnifying glass */}
      <svg
        className="mx-auto mb-5 text-slate-300"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Clipboard body */}
        <rect
          x="10"
          y="12"
          width="38"
          height="46"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Clipboard header bar */}
        <rect
          x="20"
          y="8"
          width="18"
          height="8"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Lines (content rows) */}
        <line x1="18" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="38" x2="34" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="46" x2="30" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Magnifying glass */}
        <circle cx="46" cy="48" r="9" stroke="currentColor" strokeWidth="2" />
        <line x1="52.5" y1="54.5" x2="58" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Glass cross-hatch */}
        <line x1="43" y1="48" x2="49" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="46" y1="45" x2="46" y2="51" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <h2 className="text-base font-semibold text-slate-700 mb-1">
        {hasFilters ? "No patients match your filters" : "No patients found"}
      </h2>
      <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
        {hasFilters
          ? "Try adjusting your search term or tier filter to see more results."
          : "No patient records are available right now. Check back later or add records via the API."}
      </p>

      {hasFilters && (
        <button
          id="clear-filters-btn"
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
