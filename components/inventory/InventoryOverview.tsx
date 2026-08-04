// components/inventory/InventoryOverview.tsx
"use client";

import { AlertTriangle, Boxes, PackageX, IndianRupee, ArrowRight } from "lucide-react";
import { useInventorySummary } from "@/hooks/useInventory";
import { Card, Badge, LedgerQty, Skeleton, EmptyState } from "@/components/inventory/primitives";
import type { InventoryTransaction } from "@/types/inventory";

const statCards = [
    {
        key: "totalItems",
        label: "Items Tracked",
        icon: Boxes,
        format: (v: number) => v.toLocaleString(),
        tone: "neutral",
    },
    {
        key: "totalValue",
        label: "Stock Value",
        icon: IndianRupee,
        format: (v: number) => `₹${v.toLocaleString()}`,
        tone: "neutral",
    },
    {
        key: "lowStock",
        label: "Running Low",
        icon: AlertTriangle,
        format: (v: number) => v.toLocaleString(),
        tone: "warning",
    },
    {
        key: "outOfStock",
        label: "Out of Stock",
        icon: PackageX,
        format: (v: number) => v.toLocaleString(),
        tone: "danger",
    },
] as const;

export function InventoryOverview({ onViewItem }: { onViewItem?: (id: string) => void }) {
    const { data: summary, isLoading } = useInventorySummary();
    // console.log(summary);
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {statCards.map(({ key, label, icon: Icon, format, tone = "neutral" }) => {
                    const value = summary[key as keyof typeof summary] as number;
                    const isAlert = tone === "warning" && value > 0;
                    const isDanger = tone === "danger" && value > 0;

                    // Determine icon colour
                    let iconColor = "text-[#E5DDD0]"; // default border colour
                    if (isDanger) iconColor = "text-[#D94A4A]";
                    else if (isAlert) iconColor = "text-[#E58A2C]";

                    // Determine text colour
                    let textColor = "text-[#1A2822]"; // default text
                    if (isDanger) textColor = "text-[#D94A4A]";
                    else if (isAlert) textColor = "text-[#E58A2C]";

                    return (
                        <Card
                            key={key}
                            className="p-4 rounded-xl shadow-sm border border-[#E5DDD0] bg-white"
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-medium text-[#6B7A73]">{label}</span>
                                <Icon className={`h-4 w-4 ${iconColor}`} />
                            </div>
                            <div className={`mt-3 font-mono text-2xl font-semibold tabular-nums ${textColor}`}>
                                {format(value)}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                {/* Low stock alerts */}
                <Card className="lg:col-span-3 rounded-xl shadow-sm overflow-hidden border border-[#E5DDD0] bg-white">
                    <div className="flex items-center justify-between border-b border-[#E5DDD0] px-4 py-3">
                        <h3 className="text-sm font-semibold text-[#1A2822]">Needs restocking</h3>
                        {summary.lowStock > 0 && (
                            <Badge tone="warning">{summary.lowStockItems.length} items</Badge>
                        )}
                    </div>
                    {summary.lowStock.length === 0 ? (
                        <EmptyState title="All stocked up" description="No items are below their low‑stock threshold right now." />
                    ) : (
                        <ul className="divide-y divide-[#E5DDD0]">
                            {summary.lowStockItems?.map((item: any) => (
                                <li key={item._id}>
                                    <button
                                        onClick={() => onViewItem?.(item._id)}
                                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAF9F6] bg-transparent"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-[#1A2822]">{item.name}</div>
                                            <div className="text-xs text-[#6B7A73]">
                                                Threshold: {item.minimumStock} {item.unit}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <LedgerQty
                                                value={item.currentStock}
                                                unit={item.unit}
                                                tone={item.currentStock <= 0 ? "danger" : "warning"}
                                            />
                                            <ArrowRight className="h-4 w-4 text-[#E5DDD0]" />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Recent activity */}
                <Card className="lg:col-span-2 rounded-xl shadow-sm overflow-hidden border border-[#E5DDD0] bg-white">
                    <div className="border-b border-[#E5DDD0] px-4 py-3">
                        <h3 className="text-sm font-semibold text-[#1A2822]">Recent activity</h3>
                    </div>
                    {summary.recentTransactions === 0 ? (
                        <EmptyState title="No activity yet" description="Stock movements will show up here as they happen." />
                    ) : (
                        <ul className="divide-y divide-[#E5DDD0]">
                            {summary.recentTransactions?.map((tx: any) => (
                                <TransactionRow key={tx._id} tx={tx} />
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

function TransactionRow({ tx }: { tx: InventoryTransaction }) {
    const meta: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
        stock_in: { label: "Stock in", tone: "success" },
        adjustment: { label: "Adjusted", tone: "neutral" },
        wastage: { label: "Wastage", tone: "danger" },
        sale: { label: "Sold", tone: "neutral" },
    };
    const { label, tone } = meta[tx.type] ?? { label: tx.type, tone: "neutral" };
    return (
        <li className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
                {/* <div className="truncate text-sm font-medium text-[#1A2822]">{tx.inventoryId}</div> */}
                <div className="text-xs text-[#6B7A73]">{new Date(tx.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <Badge tone={tone}>{label}</Badge>
                <LedgerQty value={tx.quantity} tone={tone === "danger" ? "danger" : "neutral"} />
            </div>
        </li>
    );
}