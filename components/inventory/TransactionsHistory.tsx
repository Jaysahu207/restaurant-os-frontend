// components/inventory/TransactionsHistory.tsx
"use client";
import type { InventoryTransaction } from "@/types/inventory";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventory";
import { Card, Select, Badge, LedgerQty, Skeleton, EmptyState, Button } from "@/components/inventory/primitives";
import type { StockMovementType } from "@/types/inventory";

const typeMeta: Record<StockMovementType, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
    stock_in: { label: "Stock in", tone: "success" },
    adjustment: { label: "Adjusted", tone: "neutral" },
    wastage: { label: "Wastage", tone: "danger" },
    sale: { label: "Sold", tone: "neutral" },
};

const LIMIT = 15;

export function TransactionsHistory() {
    const [page, setPage] = useState(1);
    const [type, setType] = useState<StockMovementType | "">("");

    const { data, isLoading, isPlaceholderData } = useInventoryTransactions({
        page,
        limit: LIMIT,
        type: type || undefined,
    });
    // console.log("TransactionsHistory data:", data.data[0].variantName); // Log the data for debugging
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A2822]">Stock movement history</h3>
                <Select
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value as StockMovementType | "");
                        setPage(1);
                    }}
                    className="w-40 border border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B]"
                >
                    <option value="">All types</option>
                    <option value="stock_in">Stock in</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="wastage">Wastage</option>
                    <option value="sale">Sale</option>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                    ))}
                </div>
            ) : !data || data.data?.length === 0 ? (
                <EmptyState title="No transactions found" description="Stock movements matching this filter will appear here." />
            ) : (
                <Card className="overflow-hidden border border-[#E5DDD0] bg-white rounded-xl shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#E5DDD0] bg-[#FAF9F6] text-left text-xs font-medium text-[#6B7A73]">
                                <th className="px-4 py-3">Item</th>
                                <th className="hidden px-4 py-3 sm:table-cell">Type</th>
                                <th className="px-4 py-3">Change</th>
                                <th className="hidden px-4 py-3 md:table-cell">Before → After</th>
                                <th className="hidden px-4 py-3 lg:table-cell">Note</th>
                                <th className="px-4 py-3 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DDD0]">
                            {data.data?.map((tx: InventoryTransaction) => {
                                const { label, tone } =
                                    typeMeta[tx.type] ?? {
                                        label: tx.type,
                                        tone: "neutral" as const,
                                    };
                                return (
                                    <tr key={tx._id} className="hover:bg-[#FAF9F6]">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[#1A2822]">{tx.inventoryId?.name}</div>
                                            <Badge tone={tone} >
                                                {label} - {tx.variantName || "No variant"}
                                            </Badge>
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <Badge tone={tone}>{label}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <LedgerQty
                                                value={tx.type === "wastage" ? -Math.abs(tx.quantity) : tx.quantity}
                                                tone={tone === "danger" ? "danger" : tone === "success" ? "success" : "neutral"}
                                            />
                                        </td>
                                        <td className="hidden px-4 py-3 text-[#6B7A73] md:table-cell">
                                            {tx.previousStock} → {tx.currentStock}
                                        </td>
                                        <td className="hidden max-w-50 truncate px-4 py-3 text-[#6B7A73] lg:table-cell">
                                            {tx.note || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-[#6B7A73]">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7A73]">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="border border-[#E5DDD0] text-[#1A2822] hover:bg-[#FAF9F6] disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= data.pagination.totalPages}
                            className="border border-[#E5DDD0] text-[#1A2822] hover:bg-[#FAF9F6] disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}