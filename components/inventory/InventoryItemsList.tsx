// components/inventory/InventoryItemsList.tsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
    MoreVertical,
    PackagePlus,
    PencilLine,
    Trash2,
} from "lucide-react";
import { useInventoryItems, useDeleteInventoryItem } from "@/hooks/useInventory";
import { Button, Badge, LedgerQty, Skeleton, EmptyState } from "@/components/inventory/primitives";
import { getStockStatus, type InventoryItem } from "@/types/inventory";
import toast from "react-hot-toast";

const statusMeta = {
    in_stock: { label: "In stock", tone: "success" as const },
    low_stock: { label: "Low stock", tone: "warning" as const },
    out_of_stock: { label: "Out of stock", tone: "danger" as const },
};

interface Props {
    onAdd: () => void;
    onEdit: (item: InventoryItem) => void;
    onUpdateStock: (item: InventoryItem) => void;
    searchQuery: string;
    categoryFilter: string;
    stockFilter: string;
}

export function InventoryItemsList({
    onAdd,
    onEdit,
    onUpdateStock,
    searchQuery,
    categoryFilter,
    stockFilter,
}: Props) {
    const { data: items, isLoading } = useInventoryItems();
    const deleteItem = useDeleteInventoryItem();

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openMenuId) {
                const target = e.target as HTMLElement;
                if (!target.closest(".row-menu")) {
                    setOpenMenuId(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenuId]);

    // Filter items based on parent props
    const filtered = useMemo(() => {
        if (!items) return [];

        let result = items;

        // Search filter
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(
                (i: any) =>
                    i.name.toLowerCase().includes(q) ||
                    i.sku?.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (categoryFilter !== "all") {
            result = result.filter((i: any) => {
                const categoryName =
                    typeof i.category === "string" ? i.category : i.category?.name;
                return categoryName === categoryFilter;
            });
        }

        // Stock status filter
        if (stockFilter !== "all") {
            result = result.filter((i: any) => getStockStatus(i) === stockFilter);
        }

        return result;
    }, [items, searchQuery, categoryFilter, stockFilter]);

    const handleDelete = (item: InventoryItem) => {
        const toastId = toast.custom(
            (t) => (
                <div
                    className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-lg border border-gray-200"
                    style={{ maxWidth: "400px" }}
                >
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                            Remove "{item.name}"?
                        </p>
                        <p className="text-xs text-gray-500">
                            This will permanently delete this inventory item.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                setDeletingId(item._id);
                                deleteItem.mutate(item._id, {
                                    onSuccess: () => {
                                        toast.success(`"${item.name}" removed`);
                                        setDeletingId(null);
                                    },
                                    onError: (error: any) => {
                                        toast.error(error?.message || "Failed to delete item");
                                        setDeletingId(null);
                                    },
                                });
                            }}
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ),
            { duration: 6000 }
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <EmptyState
                title={searchQuery ? "No items match your search" : "No inventory items yet"}
                description={
                    searchQuery
                        ? "Try a different name or SKU."
                        : "Add your first sold-as-purchased item — like bottled drinks or packaged snacks — to start tracking stock."
                }
                action={
                    !searchQuery ? (
                        <Button
                            onClick={onAdd}
                            size="sm"
                            className="bg-linear-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition"
                        >
                            <PackagePlus className="h-4 w-4" />
                            Add item
                        </Button>
                    ) : undefined
                }
            />
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Table — sm and up. Columns are hidden progressively so a tablet
                in portrait isn't forced into 8 columns; only Item / Stock /
                Status / Actions are guaranteed, the rest reveal at md / lg. */}
            <div className="hidden sm:block rounded-xl border border-[#E5DDD0] bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#E5DDD0] bg-[#F8F6F2] text-left text-xs font-medium text-[#6B7A73]">
                            <th className="px-3 py-2.5 lg:px-4 lg:py-3">Item</th>
                            <th className="hidden px-3 py-2.5 lg:table-cell lg:px-4 lg:py-3">Category</th>
                            <th className="px-3 py-2.5 lg:px-4 lg:py-3">Stock</th>
                            <th className="px-3 py-2.5 lg:px-4 lg:py-3">Status</th>
                            <th className="hidden px-3 py-2.5 lg:table-cell lg:px-4 lg:py-3">Cost</th>
                            <th className="hidden px-3 py-2.5 lg:table-cell lg:px-4 lg:py-3">Sell</th>
                            <th className="hidden px-3 py-2.5 md:table-cell md:px-4 md:py-3">Total Value</th>
                            <th className="px-3 py-2.5 text-right lg:px-4 lg:py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DDD0]">
                        {filtered.map((item: InventoryItem) => {
                            const status = getStockStatus(item);
                            const { label, tone } = statusMeta[status];
                            const categoryName =
                                typeof item.category === "string" ? item.category : "Uncategorized";
                            const isDeleting = deletingId === item._id;
                            const totalValue = item.currentStock * item.purchasePrice;

                            return (
                                <tr
                                    key={item._id}
                                    className="transition-colors hover:bg-[#F8F6F2]/50"
                                >
                                    <td className="px-3 py-2.5 lg:px-4 lg:py-3">
                                        <div className="max-w-[140px] truncate font-medium text-[#1A2822] md:max-w-none">
                                            {item.name}
                                        </div>
                                        {item.sku && (
                                            <div className="text-xs text-[#6B7A73]">SKU: {item.sku}</div>
                                        )}
                                        {/* Category shown inline below the name on tablet, where the column is hidden */}
                                        <div className="text-xs text-[#6B7A73] lg:hidden">{categoryName}</div>
                                    </td>
                                    <td className="hidden px-3 py-2.5 text-sm text-[#6B7A73] lg:table-cell lg:px-4 lg:py-3">
                                        {categoryName}
                                    </td>
                                    <td className="px-3 py-2.5 lg:px-4 lg:py-3">
                                        <LedgerQty value={item.currentStock} unit={item.unit} tone={tone} />
                                    </td>
                                    <td className="px-3 py-2.5 lg:px-4 lg:py-3">
                                        <Badge tone={tone}>{label}</Badge>
                                    </td>
                                    <td className="hidden px-3 py-2.5 text-sm text-[#6B7A73] lg:table-cell lg:px-4 lg:py-3">
                                        ₹{item.purchasePrice?.toFixed(2)}
                                    </td>
                                    <td className="hidden px-3 py-2.5 text-sm text-[#6B7A73] lg:table-cell lg:px-4 lg:py-3">
                                        ₹{item.sellingPrice?.toFixed(2)}
                                    </td>
                                    <td className="hidden px-3 py-2.5 text-sm font-medium text-[#1A2822] md:table-cell md:px-4 md:py-3">
                                        ₹{totalValue.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 lg:px-4 lg:py-3">
                                        <div className="flex items-center justify-end gap-1.5 lg:gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onUpdateStock(item)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-orange-700 hover:to-amber-700 transition lg:gap-1.5 lg:px-3 lg:text-sm"
                                            >
                                                <PackagePlus className="h-3.5 w-3.5" />
                                                <span className="hidden lg:inline">Stock</span>
                                            </Button>
                                            <RowMenu
                                                open={openMenuId === item._id}
                                                onToggle={() =>
                                                    setOpenMenuId(openMenuId === item._id ? null : item._id)
                                                }
                                                onEdit={() => {
                                                    setOpenMenuId(null);
                                                    onEdit(item);
                                                }}
                                                onDelete={() => {
                                                    setOpenMenuId(null);
                                                    handleDelete(item);
                                                }}
                                                isDeleting={isDeleting}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards — tightened padding/type so more rows fit per screen */}
            <div className="space-y-2 sm:hidden">
                {filtered.map((item: InventoryItem) => {
                    const status = getStockStatus(item);
                    const { label, tone } = statusMeta[status];
                    const categoryName =
                        typeof item.category === "string" ? item.category : "Uncategorized";
                    const isDeleting = deletingId === item._id;

                    return (
                        <div
                            key={item._id}
                            className="rounded-xl border border-[#E5DDD0] bg-white p-3 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-[#1A2822]">
                                        {item.name}
                                    </div>
                                    <div className="truncate text-xs text-[#6B7A73]">{categoryName}</div>
                                </div>
                                <Badge tone={tone}>{label}</Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <LedgerQty value={item.currentStock} unit={item.unit} tone={tone} />
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        onClick={() => onUpdateStock(item)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-orange-700 hover:to-amber-700 transition"
                                    >
                                        <PackagePlus className="h-3.5 w-3.5" />
                                        Stock
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(item)}
                                        className="h-8 w-8 rounded-lg text-[#6B7A73] hover:bg-[#F8F6F2]"
                                    >
                                        <PencilLine className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(item)}
                                        disabled={isDeleting}
                                        className="h-8 w-8 rounded-lg text-[#6B7A73] hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// RowMenu component (unchanged)
function RowMenu({
    open,
    onToggle,
    onEdit,
    onDelete,
    isDeleting = false,
}: {
    open: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onToggle();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onToggle]);

    return (
        <div className="relative row-menu" ref={menuRef}>
            <button
                onClick={onToggle}
                aria-label="More actions"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7A73] hover:bg-[#F8F6F2]"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
                <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-[#E5DDD0] bg-white shadow-lg">
                    <button
                        onClick={onEdit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1A2822] transition-colors hover:bg-[#F8F6F2]"
                    >
                        <PencilLine className="h-3.5 w-3.5" />
                        Edit
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isDeleting ? "Removing..." : "Remove"}
                    </button>
                </div>
            )}
        </div>
    );
}