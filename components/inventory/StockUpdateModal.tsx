// components/inventory/StockUpdateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { PackagePlus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Modal, Field, Input, Button, cn, LedgerQty } from "@/components/inventory/primitives";
import { useUpdateStock } from "@/hooks/useInventory";
import type { InventoryItem, StockMovementType } from "@/types/inventory";

const MOVEMENTS: { type: StockMovementType; label: string; icon: typeof PackagePlus; hint: string }[] = [
    { type: "stock_in", label: "Stock in", icon: PackagePlus, hint: "New delivery received — adds to stock" },
    { type: "adjustment", label: "Adjustment", icon: SlidersHorizontal, hint: "Correct a count mismatch — sets a difference" },
    { type: "wastage", label: "Wastage", icon: Trash2, hint: "Damaged, expired, or lost — removes from stock" },
];

interface Props {
    open: boolean;
    onClose: () => void;
    item: InventoryItem | null;
}

export function StockUpdateModal({ open, onClose, item }: Props) {
    const [type, setType] = useState<StockMovementType>("stock_in");
    const [quantity, setQuantity] = useState<number>(1);
    const [note, setNote] = useState("");
    const updateStock = useUpdateStock();

    useEffect(() => {
        if (open) {
            setType("stock_in");
            setQuantity(1);
            setNote("");
        }
    }, [open, item?._id]);

    if (!item) return null;

    const signedQuantity = type === "wastage" ? -Math.abs(quantity) : quantity;
    const resultingQty =
        type === "stock_in"
            ? item.currentStock + quantity
            : Math.max(0, item.currentStock - quantity);

    function handleSubmit() {
        if (!item) return;
        updateStock.mutate(
            {
                id: item._id,
                data: {
                    quantity: type === "adjustment" ? quantity : Math.abs(quantity),
                    type,
                    note: note.trim() || undefined,
                },
            },
            { onSuccess: onClose }
        );
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Update stock — ${item.name}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={updateStock.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateStock.isPending || quantity < 0}>
                        {updateStock.isPending ? "Saving…" : "Confirm"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 border border-[#E5E1D8] rounded-lg p-2">
                    {MOVEMENTS.map(({ type: t, label, icon: Icon }) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                                type === t
                                    ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                                    : "border-[#E5E1D8] text-[#1F2A24] hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400">{MOVEMENTS.find((m) => m.type === type)?.hint}</p>

                <Field label={type === "adjustment" ? "New quantity" : "Quantity"}>
                    <Input
                        type="number"
                        min={0}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                </Field>

                <Field label="Note (optional)">
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier invoice #1042" />
                </Field>

                <div className="flex items-center justify-between rounded-lg bg-[#FAF9F6] px-3 py-2.5">
                    <span className="text-xs text-gray-500">Current → After</span>
                    <div className="flex items-center gap-2">
                        <LedgerQty
                            value={item.currentStock}
                            unit={item.unit}
                        />
                        <span className="text-gray-300">→</span>
                        <LedgerQty
                            value={resultingQty}
                            unit={item.unit}
                            tone={resultingQty <= item.minimumStock ? "warning" : "success"}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}