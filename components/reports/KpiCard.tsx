// components/reports/KpiCard.tsx

import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react";
import type { Growth } from "@/types/reports";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  growth?: Growth | null;
  /** For metrics where an increase is bad (e.g. cancellations, discounts) */
  invertColor?: boolean;
}

export function KpiCard({ label, value, icon: Icon, growth, invertColor = false }: KpiCardProps) {
  const percent = growth?.percent ?? null;
  const isNew = growth && growth.previous === 0 && growth.current > 0;

  let trendColor = "text-gray-400";
  let TrendIcon = Minus;
  if (percent !== null && percent !== 0) {
    const isPositive = percent > 0;
    const isGood = invertColor ? !isPositive : isPositive;
    trendColor = isGood ? "text-emerald-600" : "text-red-600";
    TrendIcon = isPositive ? ArrowUp : ArrowDown;
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {growth && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              {isNew ? (
                <span>New this period</span>
              ) : percent === null ? (
                <span className="text-gray-400">—</span>
              ) : (
                <>
                  <TrendIcon className="w-3 h-3" />
                  <span>{Math.abs(percent)}%</span>
                  <span className="text-gray-400 font-normal">vs previous period</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-orange-50 text-[#F97316] shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
