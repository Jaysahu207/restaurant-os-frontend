// hooks/useReportsOverview.ts

import { useQuery } from "@tanstack/react-query";
import { fetchReportsOverview } from "@/services/reportService";
import type { ReportsOverviewParams } from "@/types/reports";

export function useReportsOverview(params: ReportsOverviewParams) {
  return useQuery({
    queryKey: ["reports", "overview", params],
    queryFn: () => fetchReportsOverview(params),
    // Custom range with an incomplete "to" date shouldn't fire yet
    enabled: params.range !== "custom" || Boolean(params.from && params.to),
    staleTime: 60 * 1000,
  });
}
