import * as XLSX from "xlsx";
import type { ReportsOverviewData } from "@/types/reports";

const PRESET_LABELS: Record<string, string> = {
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

const formatDate = (
    value: string | Date | undefined,
    timezone = "Asia/Kolkata"
) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
};

const formatDateTime = (
    value: string | Date | undefined,
    timezone = "Asia/Kolkata"
) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour} ${suffix}`;
};

const addSheet = (
    workbook: XLSX.WorkBook,
    sheetName: string,
    rows: unknown[][]
) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = Array.from(
        {
            length: Math.max(...rows.map((row) => row.length)),
        },
        (_, columnIndex) => {
            const maxLength = Math.max(
                ...rows.map((row) =>
                    String(row[columnIndex] ?? "").length
                )
            );

            return {
                wch: Math.min(Math.max(maxLength + 2, 12), 40),
            };
        }
    );

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName
    );
};

export function exportReportsToExcel(
    data: ReportsOverviewData
) {
    const workbook = XLSX.utils.book_new();

    const timezone =
        data.restaurant?.timezone || "Asia/Kolkata";

    const preset =
        data.dateRange?.preset || "custom";

    const presetLabel =
        PRESET_LABELS[preset] || preset;

    // =====================================================
    // 1. REPORT SUMMARY
    // =====================================================

    addSheet(workbook, "Summary", [
        ["QRasoi - Restaurant Analytics Report"],
        [],
        ["Restaurant", data.restaurant?.name || ""],
        ["Report Period", presetLabel],
        [
            "Start Date",
            formatDate(data.dateRange?.start, timezone),
        ],
        [
            "End Date",
            formatDate(data.dateRange?.end, timezone),
        ],
        ["Timezone", timezone],
        [],
        ["Metric", "Value"],
        [
            "Gross Sales",
            data.summary?.grossSales ?? 0,
        ],
        [
            "Net Sales",
            data.summary?.netSales ?? 0,
        ],
        [
            "Total Tax",
            data.summary?.totalTax ?? 0,
        ],
        [
            "Service Charge",
            data.summary?.totalServiceCharge ?? 0,
        ],
        [
            "Total Orders",
            data.summary?.totalOrders ?? 0,
        ],
        [
            "Average Order Value",
            data.summary?.avgOrderValue ?? 0,
        ],
    ]);

    // =====================================================
    // 2. SALES TREND
    // =====================================================

    const salesRows: unknown[][] = [
        [
            "Date",
            "Gross Sales",
            "Net Sales",
            "Orders",
            "Tax",
            "CGST",
            "SGST",
            "Service Charge",
            "Delivery Charge",
            "Final Sales",
        ],
    ];

    data.salesTrend?.points?.forEach((item) => {
        salesRows.push([
            formatDate(item.date, timezone),
            item.grossSales ?? 0,
            item.netSales ?? 0,
            item.orders ?? 0,
            item.tax ?? 0,
            item.cgst ?? 0,
            item.sgst ?? 0,
            item.serviceCharge ?? 0,
            item.deliveryCharge ?? 0,
            item.finalSales ?? 0,
        ]);
    });

    addSheet(workbook, "Sales Trend", salesRows);

    // =====================================================
    // 3. HOURLY SALES
    // =====================================================

    const hourlyRows: unknown[][] = [
        [
            "Hour",
            "Orders",
            "Sales",
            "Average Order Value",
        ],
    ];

    data.hourlySales?.hourly?.forEach((item) => {
        hourlyRows.push([
            formatHour(item.hour),
            item.orders ?? 0,
            item.sales ?? 0,
            item.avgOrderValue ?? 0,
        ]);
    });

    if (data.hourlySales?.peakHour) {
        hourlyRows.push([]);
        hourlyRows.push(["Peak Hour"]);
        hourlyRows.push([
            formatHour(data.hourlySales.peakHour.hour),
            data.hourlySales.peakHour.orders,
            data.hourlySales.peakHour.sales,
            data.hourlySales.peakHour.avgOrderValue,
        ]);
    }

    addSheet(workbook, "Hourly Sales", hourlyRows);

    // =====================================================
    // 4. TOP PRODUCTS
    // =====================================================

    const topProductRows: unknown[][] = [
        [
            "Product",
            "Category",
            "Quantity Sold",
            "Orders",
            "Gross Sales",
            "Net Sales",
            "Average Price",
            "Last Sale",
        ],
    ];

    data.topProducts?.forEach((item) => {
        topProductRows.push([
            item.name,
            item.category,
            item.quantitySold,
            item.orders,
            item.grossSales,
            item.netSales,
            item.avgPrice,
            formatDateTime(
                item.lastSaleDate,
                timezone
            ),
        ]);
    });

    addSheet(
        workbook,
        "Top Products",
        topProductRows
    );

    // =====================================================
    // 5. LOW PRODUCTS
    // =====================================================

    const lowProductRows: unknown[][] = [
        [
            "Product",
            "Category",
            "Quantity Sold",
            "Orders",
            "Gross Sales",
            "Net Sales",
            "Average Price",
            "Last Sale",
        ],
    ];

    data.lowProducts?.forEach((item) => {
        lowProductRows.push([
            item.name,
            item.category,
            item.quantitySold,
            item.orders,
            item.grossSales,
            item.netSales,
            item.avgPrice,
            formatDateTime(
                item.lastSaleDate,
                timezone
            ),
        ]);
    });

    addSheet(
        workbook,
        "Low Products",
        lowProductRows
    );

    // =====================================================
    // 6. CATEGORY PERFORMANCE
    // =====================================================

    const categoryRows: unknown[][] = [
        [
            "Category",
            "Items Sold",
            "Orders",
            "Gross Sales",
            "Net Sales",
            "% Of Total",
        ],
    ];

    data.categoryPerformance?.forEach((item) => {
        categoryRows.push([
            item.category,
            item.itemsSold,
            item.orders,
            item.grossSales,
            item.netSales,
            item.percentOfTotal,
        ]);
    });

    addSheet(
        workbook,
        "Categories",
        categoryRows
    );

    // =====================================================
    // 7. PAYMENT ANALYTICS
    // =====================================================

    const paymentRows: unknown[][] = [
        ["Total Sales", data.paymentAnalytics?.totalSales ?? 0],
        [],
        [
            "Payment Method",
            "Transactions",
            "Amount",
            "Percentage",
        ],
    ];

    data.paymentAnalytics?.methods?.forEach((item) => {
        paymentRows.push([
            item.method.toUpperCase(),
            item.transactions,
            item.amount,
            item.percentage,
        ]);
    });

    addSheet(
        workbook,
        "Payments",
        paymentRows
    );

    // =====================================================
    // 8. ORDER STATUS
    // =====================================================

    const statusRows: unknown[][] = [
        [
            "Total Orders",
            data.orderStatusAnalytics?.totalOrders ?? 0,
        ],
        [],
        ["Status", "Orders", "Percentage"],
    ];

    data.orderStatusAnalytics?.statuses?.forEach((item) => {
        statusRows.push([
            item.status,
            item.count,
            item.percentage,
        ]);
    });

    addSheet(
        workbook,
        "Order Status",
        statusRows
    );

    // =====================================================
    // 9. CUSTOMER ANALYTICS
    // =====================================================

    addSheet(workbook, "Customer Analytics", [
        [
            "Customer Metric",
            "Value",
        ],
        [
            "Total Customers",
            data.customerAnalytics?.totalCustomers ?? 0,
        ],
        [
            "New Customers",
            data.customerAnalytics?.newCustomers ?? 0,
        ],
        [
            "Returning Customers",
            data.customerAnalytics?.returningCustomers ?? 0,
        ],
        [
            "Repeat Rate %",
            data.customerAnalytics?.repeatRate ?? 0,
        ],
        [
            "Average Customer Spend",
            data.customerAnalytics?.avgCustomerSpend ?? 0,
        ],
        [
            "Average Orders Per Customer",
            data.customerAnalytics?.avgOrdersPerCustomer ?? 0,
        ],
    ]);

    // =====================================================
    // 10. TOP CUSTOMERS
    // =====================================================

    const customerRows: unknown[][] = [
        [
            "Customer",
            "Phone",
            "Orders",
            "Total Spent",
            "Average Order Value",
            "Last Order",
            "Customer Type",
        ],
    ];

    data.customerAnalytics?.topCustomers?.forEach((item) => {
        customerRows.push([
            item.name,
            item.phone,
            item.orders,
            item.totalSpent,
            item.avgOrderValue,
            formatDateTime(
                item.lastOrder,
                timezone
            ),
            item.isNew ? "New" : "Returning",
        ]);
    });

    addSheet(
        workbook,
        "Top Customers",
        customerRows
    );

    // =====================================================
    // 11. COMPARISON
    // =====================================================

    const comparison = data.summary?.comparison;

    const comparisonRows: unknown[][] = [
        [
            "Metric",
            "Current",
            "Previous",
            "Difference",
            "Change %",
        ],
    ];

    if (comparison) {
        comparisonRows.push([
            "Gross Sales",
            comparison.grossSales?.current ?? 0,
            comparison.grossSales?.previous ?? 0,
            comparison.grossSales?.difference ?? 0,
            comparison.grossSales?.percent ?? 0,
        ]);

        comparisonRows.push([
            "Net Sales",
            comparison.netSales?.current ?? 0,
            comparison.netSales?.previous ?? 0,
            comparison.netSales?.difference ?? 0,
            comparison.netSales?.percent ?? 0,
        ]);

        comparisonRows.push([
            "Total Orders",
            comparison.totalOrders?.current ?? 0,
            comparison.totalOrders?.previous ?? 0,
            comparison.totalOrders?.difference ?? 0,
            comparison.totalOrders?.percent ?? 0,
        ]);

        comparisonRows.push([
            "Average Order Value",
            comparison.avgOrderValue?.current ?? 0,
            comparison.avgOrderValue?.previous ?? 0,
            comparison.avgOrderValue?.difference ?? 0,
            comparison.avgOrderValue?.percent ?? 0,
        ]);
    }

    addSheet(
        workbook,
        "Comparison",
        comparisonRows
    );

    // =====================================================
    // 12. INSIGHTS
    // =====================================================

    const insightRows: unknown[][] = [
        ["Type", "Insight"],
    ];

    data.insights?.forEach((item) => {
        insightRows.push([
            `${item.icon || ""} ${item.type}`,
            item.text,
        ]);
    });

    addSheet(
        workbook,
        "Insights",
        insightRows
    );

    // =====================================================
    // FILE NAME
    // =====================================================

    const startDate = data.dateRange?.start
        ? new Date(data.dateRange.start)
            .toISOString()
            .slice(0, 10)
        : "start";

    const endDate = data.dateRange?.end
        ? new Date(data.dateRange.end)
            .toISOString()
            .slice(0, 10)
        : "end";

    const restaurantName =
        data.restaurant?.name
            ?.replace(/[^a-zA-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") ||
        "Restaurant";

    const fileName =
        `QRasoi_${restaurantName}_${startDate}_to_${endDate}.xlsx`;

    XLSX.writeFile(workbook, fileName);
}