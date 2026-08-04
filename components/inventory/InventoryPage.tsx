// components/inventory/InventoryPage.tsx
"use client";

import { useState } from "react";
import { Card, cn } from "@/components/inventory/primitives";
import { InventoryItemsList } from "./InventoryItemsList";
import { InventoryItemFormModal } from "./InventoryItemFormModal";
import { StockUpdateModal } from "./StockUpdateModal";
import type { InventoryItem } from "@/types/inventory";
import {
    AlertTriangle,
    Boxes,
    PackageX,
    IndianRupee,
    Search,
    Plus,
} from "lucide-react";
import { useInventorySummary } from "@/hooks/useInventory";

const statCards = [
    {
        key: "totalItems",
        label: "Items Tracked",
        shortLabel: "Items",
        icon: Boxes,
        format: (v: number) => v.toLocaleString(),
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        key: "totalValue",
        label: "Stock Value",
        shortLabel: "Value",
        icon: IndianRupee,
        format: (v: number) => `₹${v.toLocaleString()}`,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
    },
    {
        key: "lowStock",
        label: "Running Low",
        shortLabel: "Low",
        icon: AlertTriangle,
        format: (v: number) => v.toLocaleString(),
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
    {
        key: "outOfStock",
        label: "Out of Stock",
        shortLabel: "Out",
        icon: PackageX,
        format: (v: number) => v.toLocaleString(),
        color: "text-rose-600",
        bg: "bg-rose-50",
    },
] as const;

export function InventoryPage() {
    const [formItem, setFormItem] = useState<InventoryItem | null | undefined>(
        undefined
    );
    const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [stockFilter, setStockFilter] = useState<string>("all");

    const { data: summary } = useInventorySummary();
    const stats = summary ?? {
        totalItems: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
    };

    return (
        <div className="min-h-screen bg-[#F8F6F2] pb-8">
            {/* --- Header --- */}
            <div className="border-b border-[#E5DDD0] bg-white shadow-sm px-3 sm:px-6">
                <div className="flex items-center justify-between gap-3 py-3 sm:py-5">
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-[#1A2822] tracking-tight sm:text-2xl">
                            Inventory
                        </h1>
                        <p className="hidden text-sm text-[#6B7A73] sm:block">
                            Track stock for items you sell as‑is.
                        </p>
                    </div>
                    <button
                        onClick={() => setFormItem(null)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-orange-700 hover:to-amber-700 transition sm:px-3 sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Item</span>
                    </button>
                </div>

                {/* --- Stats Cards --- */}
                <div className="grid grid-cols-2 gap-2 pb-3 sm:gap-3 sm:pb-5 md:grid-cols-4 md:gap-4">
                    {statCards.map(({ key, label, shortLabel, icon: Icon, format, color, bg }) => {
                        const value = stats[key as keyof typeof stats];
                        const isAlert = key === "lowStock" && value > 0;
                        const isDanger = key === "outOfStock" && value > 0;
                        const textColor = isDanger
                            ? "text-rose-600"
                            : isAlert
                                ? "text-amber-600"
                                : color;

                        return (
                            <Card
                                key={key}
                                className="flex items-center gap-2 rounded-xl border border-[#E5DDD0] bg-white p-2.5 shadow-sm sm:gap-3 sm:p-4"
                            >
                                <div className={cn("shrink-0 rounded-full p-1.5 sm:p-2.5", bg)}>
                                    <Icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", textColor)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[#6B7A73] sm:text-xs">
                                        <span className="sm:hidden">{shortLabel}</span>
                                        <span className="hidden sm:inline">{label}</span>
                                    </p>
                                    <p className="font-mono text-sm font-semibold tabular-nums text-[#1A2822] sm:text-xl">
                                        {format(value)}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* --- Toolbar (search + filters) --- */}
            <div className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2 sm:justify-between ">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A73]" />

                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-[#E5DDD0] bg-white py-2 pl-10 pr-4 text-sm text-[#1A2822] placeholder:text-[#6B7A73] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="w-32 sm:w-auto">
                        <div className="rounded-lg border border-[#E5DDD0] bg-white px-2 py-1.5 text-sm text-[#1A2822] focus-within:ring-1 focus-within:ring-orange-500">
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="w-full bg-transparent text-sm text-[#1A2822] focus:outline-none"
                            >
                                <option value="all">All Stock</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Inventory List --- */}
                <div className="mt-3 sm:mt-4">
                    <InventoryItemsList
                        onAdd={() => setFormItem(null)}
                        onEdit={(item) => setFormItem(item)}
                        onUpdateStock={(item) => setStockItem(item)}
                        searchQuery={searchQuery}
                        categoryFilter={categoryFilter}
                        stockFilter={stockFilter}
                    />
                </div>
            </div>

            {/* --- Modals --- */}
            <InventoryItemFormModal
                open={formItem !== undefined}
                onClose={() => setFormItem(undefined)}
                item={formItem}
            />
            <StockUpdateModal
                open={!!stockItem}
                onClose={() => setStockItem(null)}
                item={stockItem}
            />
        </div>
    );
}