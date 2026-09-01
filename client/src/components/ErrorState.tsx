interface Props {
  error: string;
  onRetry: () => void;
}

/**
 * Illustrated error state with retry button.
 * Shown when /api/patients or /api/stats fails.
 */
export default function ErrorState({ error, onRetry }: Props) {
  return (
    <div
      className="rounded-2xl border border-red-500/30 bg-red-950/40 backdrop-blur-sm px-6 py-10 text-center"
      role="alert"
    >
      {/* Inline SVG illustration */}
      <svg
        className="mx-auto mb-4 text-red-400"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" />
        <path
          d="M28 17v14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="28" cy="37" r="1.5" fill="currentColor" />
      </svg>

      <h2 className="text-base font-semibold text-red-300 mb-1">
        Unable to load patient data
      </h2>
      <p className="text-sm text-red-200/70 mb-5 max-w-sm mx-auto">{error}</p>

      <button
        id="retry-load-btn"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium transition-colors border border-red-500/50"
      >
        {/* Refresh icon */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7.5 1.5A6 6 0 1 1 2.636 3.636"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M1.5 1.5v3h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Try again
      </button>
    </div>
  );
}
