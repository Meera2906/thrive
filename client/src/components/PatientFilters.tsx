import { Search } from "lucide-react";
import { SortKey, TierFilter } from "../types";

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  tier: TierFilter;
  onTierChange: (v: TierFilter) => void;
  sortKey: SortKey;
  onSortKeyChange: (v: SortKey) => void;
}

const TIERS: TierFilter[] = ["All", "High", "Medium", "Low", "Insufficient history"];
const SORTS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Risk score" },
  { value: "overdue", label: "Days overdue" },
  { value: "distance", label: "Distance" },
];

export default function PatientFilters({
  query,
  onQueryChange,
  tier,
  onTierChange,
  sortKey,
  onSortKeyChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by patient name or ID..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid focus:bg-white/10 transition-colors"
        />
      </div>

      <select
        value={tier}
        onChange={(e) => onTierChange(e.target.value as TierFilter)}
        className="px-3 py-2 rounded-lg bg-[#1a1525] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid transition-colors"
      >
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {t === "All" ? "All tiers" : t}
          </option>
        ))}
      </select>

      <select
        value={sortKey}
        onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
        className="px-3 py-2 rounded-lg bg-[#1a1525] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid transition-colors"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort by {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
