// types/reports.ts

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export interface Growth {
  current: number;
  previous: number;
  difference: number;
  percent: number | null; // null = undefined growth (previous period was zero)
}

export interface SalesSummary {
  grossSales: number;
  netSales: number;
  totalTax: number;
  totalServiceCharge: number;
  totalOrders: number;
  avgOrderValue: number;
  comparison: {
    grossSales: Growth;
    netSales: Growth;
    totalOrders: Growth;
    avgOrderValue: Growth;
  } | null;
}

export interface SalesTrendPoint {
  date: string;
  grossSales: number;
  netSales: number;
  orders: number;
  tax: number;
  cgst: number;
  sgst: number;
  serviceCharge: number;
  deliveryCharge: number;
  finalSales: number;
}

export interface SalesTrend {
  granularity: "day" | "week" | "month";
  points: SalesTrendPoint[];
}

export interface HourlySalesRow {
  hour: number;
  orders: number;
  sales: number;
  avgOrderValue: number;
}

export interface HourlySales {
  hourly: HourlySalesRow[];
  peakHour: HourlySalesRow | null;
}

export interface ProductPerformanceRow {
  menuItemId: string | null;
  name: string;
  category: string;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  avgPrice: number;
  orders: number;
  lastSaleDate: string;
}

export interface CategoryPerformanceRow {
  category: string;
  itemsSold: number;
  grossSales: number;
  netSales: number;
  orders: number;
  percentOfTotal: number;
}

export interface PaymentMethodRow {
  method: string;
  transactions: number;
  amount: number;
  percentage: number;
}

export interface PaymentAnalytics {
  totalSales: number;
  methods: PaymentMethodRow[];
}

export interface OrderStatusRow {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderStatusAnalytics {
  totalOrders: number;
  statuses: OrderStatusRow[];
}

export interface TopCustomerRow {
  customerId: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrder: string;
  isNew: boolean;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  avgCustomerSpend: number;
  avgOrdersPerCustomer: number;
  topCustomers: TopCustomerRow[];
}

export interface ReportInsight {
  type: string;
  icon: string;
  text: string;
}

export interface ReportsOverviewData {
  restaurant: { name: string; timezone: string };
  dateRange: {
    preset: DateRangePreset;
    start: string;
    end: string;
    compareStart: string | null;
    compareEnd: string | null;
  };
  summary: SalesSummary;
  salesTrend: SalesTrend;
  hourlySales: HourlySales;
  topProducts: ProductPerformanceRow[];
  lowProducts: ProductPerformanceRow[];
  categoryPerformance: CategoryPerformanceRow[];
  paymentAnalytics: PaymentAnalytics;
  orderStatusAnalytics: OrderStatusAnalytics;
  customerAnalytics: CustomerAnalytics;
  insights: ReportInsight[];
}

export interface ReportsOverviewParams {
  range: DateRangePreset;
  from?: string;
  to?: string;
  compare?: boolean;
  granularity?: "day" | "week" | "month";
}
