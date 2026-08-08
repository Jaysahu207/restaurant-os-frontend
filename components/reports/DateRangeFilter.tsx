// components/reports/DateRangeFilter.tsx

"use client";

import { useState } from "react";
import { Calendar, ChevronDown, GitCompare } from "lucide-react";
import type { DateRangePreset } from "@/types/reports";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 Days",
  last30: "Last 30 Days",
  thisWeek: "This Week",
  lastWeek: "Last Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  thisYear: "This Year",
  custom: "Custom Range",
};

const PRESET_ORDER: DateRangePreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "custom",
];

interface DateRangeFilterProps {
  range: DateRangePreset;
  from?: string;
  to?: string;
  compare: boolean;
  onChange: (next: { range: DateRangePreset; from?: string; to?: string }) => void;
  onCompareChange: (compare: boolean) => void;
}

export function DateRangeFilter({ range, from, to, compare, onChange, onCompareChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-800">
            {range === "custom" && from && to ? `${from} → ${to}` : PRESET_LABELS[range]}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            {PRESET_ORDER.filter((p) => p !== "custom").map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  onChange({ range: preset });
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-orange-50 ${
                  range === preset ? "text-[#F97316] font-medium" : "text-gray-700"
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-2 px-4 space-y-2">
              <p className="text-xs font-medium text-gray-500">Custom Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5"
                />
              </div>
              <button
                disabled={!customFrom || !customTo}
                onClick={() => {
                  onChange({ range: "custom", from: customFrom, to: customTo });
                  setOpen(false);
                }}
                className="w-full text-xs font-medium bg-[#F97316] text-white rounded-md py-1.5 disabled:opacity-40 mb-1"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onCompareChange(!compare)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          compare
            ? "border-[#F97316] bg-orange-50 text-[#F97316]"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <GitCompare className="w-4 h-4" />
        Compare Previous Period
      </button>
    </div>
  );
}
