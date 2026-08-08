// components/reports/ReportInsights.tsx

import type { ReportInsight } from "@/types/reports";

export function ReportInsights({ insights }: { insights: ReportInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Business Insights</h3>
      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
            <span className="text-base leading-none mt-0.5">{insight.icon}</span>
            <span>{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
