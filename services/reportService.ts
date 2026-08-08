// services/reportService.ts
//
// ASSUMPTION: importing the shared Axios instance from "@/config/axios",
// matching the path your Inventory module uses. Adjust this import if your
// actual instance lives somewhere else (e.g. "@/lib/api" or "@/services/api").

import API from "@/config/axios";
import axios from "@/config/axios";
import type { ReportsOverviewData, ReportsOverviewParams } from "@/types/reports";

export async function fetchReportsOverview(
  params: ReportsOverviewParams,
): Promise<ReportsOverviewData> {
  const { range, from, to, compare = true, granularity } = params;

  const { data } = await API.get("/api/analytics/overview", {
    params: {
      range,
      from: range === "custom" ? from : undefined,
      to: range === "custom" ? to : undefined,
      compare,
      granularity,
    },
  });
  // console.log("📊 Reports Overview Response:", data);
  if (!data.success) {
    throw new Error(data.message || "Unable to load reports");
  }

  return data.data as ReportsOverviewData;
}
