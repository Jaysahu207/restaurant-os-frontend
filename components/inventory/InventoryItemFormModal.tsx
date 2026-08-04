// components/inventory/InventoryItemFormModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal, Field, Input, Select, Button } from "@/components/inventory/primitives";
import { useCreateInventoryItem, useUpdateInventoryItem } from "@/hooks/useInventory";
import { InventoryItem, InventoryUnit } from "@/types/inventory";
import { useMenuDropdown } from "@/hooks/useMenu";

const UNITS = [
    "pcs",
    "bottle",
    "packet",
    "box",
    "can",
    "cup",
    "kg",
    "g",
    "liter",
    "ml",
] as const;

export interface InventoryItemFormValues {
    menuItemId: string;
    variantId?: string | null;
    variantName?: string | null;
    // These come from the menu item and are read‑only
    name: string;
    category: string;
    image?: string;
    sellingPrice?: number;
    // Inventory‑managed fields – editable
    unit: InventoryUnit | string;
    currentStock: number;
    minimumStock: number;
    purchasePrice?: number;
}

const emptyForm: InventoryItemFormValues = {
    menuItemId: "",
    variantId: null,
    variantName: null,
    name: "",
    category: "",
    image: "",
    sellingPrice: undefined,
    unit: "pcs",
    currentStock: 0,
    minimumStock: 5,
    purchasePrice: undefined,
};

interface Props {
    open: boolean;
    onClose: () => void;
    item?: InventoryItem | null; // item should now include menuItemId, variantId, variantName
}

export function InventoryItemFormModal({ open, onClose, item }: Props) {
    const [form, setForm] = useState<InventoryItemFormValues>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof InventoryItemFormValues, string>>>({});
    const createItem = useCreateInventoryItem();
    const updateItem = useUpdateInventoryItem();
    const { data: menuItems = [] } = useMenuDropdown();
    const isEditing = !!item;
    const isSaving = createItem.isPending || updateItem.isPending;

    // Helper to find selected menu item and its variants
    const selectedMenuItem = menuItems.find((m: any) => m._id === form.menuItemId);
    const hasVariants = selectedMenuItem?.variants?.length > 0;

    // Reset form when modal opens/closes or item changes
    useEffect(() => {
        if (item) {
            setForm({
                menuItemId: item.menuItemId || "",
                variantId: item.variantId || null,
                variantName: item.variantName || null,
                name: item.name || "",
                category: item.category || "",
                image: item.image || "",
                sellingPrice: item.sellingPrice,
                unit: item.unit || "pcs",
                currentStock: item.currentStock ?? 0,
                minimumStock: item.minimumStock ?? 5,
                purchasePrice: item.purchasePrice,
            });
        } else {
            setForm(emptyForm);
        }
        setErrors({});
    }, [item, open]);

    const handleMenuSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = menuItems.find((x: any) => x._id === e.target.value);
        if (!selected) return;

        // Reset variant-related fields
        setForm((prev) => ({
            ...prev,
            menuItemId: selected._id,
            name: selected.name,
            category: selected.category,
            image: selected.image,
            variantId: null,
            variantName: null,
            sellingPrice: selected.variants?.length ? undefined : selected.price,
        }));

        if (errors.menuItemId) {
            setErrors((prev) => ({ ...prev, menuItemId: undefined }));
        }
    };

    const handleVariantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const variantId = e.target.value;
        if (!selectedMenuItem) return;

        if (variantId === "") {
            // User deselected variant – fallback to main price
            setForm((prev) => ({
                ...prev,
                variantId: null,
                variantName: null,
                sellingPrice: selectedMenuItem.price,
            }));
            return;
        }

        const variant = selectedMenuItem.variants.find((v: any) => v._id === variantId);
        if (!variant) return;

        setForm((prev) => ({
            ...prev,
            variantId: variant._id,
            variantName: variant.name,
            sellingPrice: variant.price,
        }));
    };

    function validate() {
        const next: typeof errors = {};

        if (!form.menuItemId) {
            next.menuItemId = "Please select a menu item";
        }
        // If the menu item has variants, ensure a variant is selected
        if (hasVariants && !form.variantId) {
            next.variantId = "Please select a variant";
        }
        if (form.currentStock < 0) {
            next.currentStock = "Stock can't be negative";
        }
        if (form.minimumStock < 0) {
            next.minimumStock = "Minimum stock can't be negative";
        }
        if (form.purchasePrice !== undefined && form.purchasePrice < 0) {
            next.purchasePrice = "Purchase price can't be negative";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;

        const payload = {
            menuItemId: form.menuItemId,
            variantId: form.variantId || undefined,
            variantName: form.variantName || undefined,
            name: form.name,
            category: form.category,
            unit: form.unit,
            currentStock: form.currentStock,
            minimumStock: form.minimumStock,
            purchasePrice: form.purchasePrice,
            sellingPrice: form.sellingPrice, // this comes from menu or variant
            image: form.image,
        };

        if (isEditing && item) {
            updateItem.mutate(
                { id: item._id, data: payload },
                { onSuccess: () => onClose() }
            );
        } else {
            createItem.mutate(payload, { onSuccess: () => onClose() });
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEditing ? "Edit inventory item" : "Add inventory item"}
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSaving}
                        className="border border-[#E5DDD0] text-[#1A2822] hover:bg-[#FAF9F6] disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-orange-700 hover:to-amber-700 transition"
                    >
                        {isSaving ? "Saving…" : isEditing ? "Save changes" : "Add item"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Menu Item Dropdown */}
                <Field label="Menu item" error={errors.menuItemId}>
                    <Select
                        value={form.menuItemId}
                        onChange={handleMenuSelect}
                        disabled={isEditing}
                        className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent disabled:opacity-60"
                    >
                        <option value="">Select a menu item</option>
                        {menuItems.map((m: any) => (
                            <option key={m._id} value={m._id}>
                                {m.name}
                            </option>
                        ))}
                    </Select>
                    {isEditing && (
                        <p className="mt-1 text-xs text-[#6B7A73]">
                            Menu item cannot be changed after creation.
                        </p>
                    )}
                </Field>

                {/* Variant Dropdown – shown only if the selected menu item has variants */}
                {hasVariants && (
                    <Field label="Variant" error={errors.variantId}>
                        <Select
                            value={form.variantId || ""}
                            onChange={handleVariantSelect}
                            disabled={isEditing}
                            className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent disabled:opacity-60"
                        >
                            <option value="">Select a variant</option>
                            {selectedMenuItem?.variants?.map((v: any) => (
                                <option key={v._id} value={v._id}>
                                    {v.name} (₹{v.price})
                                </option>
                            ))}
                        </Select>
                        {isEditing && (
                            <p className="mt-1 text-xs text-[#6B7A73]">
                                Variant cannot be changed after creation.
                            </p>
                        )}
                    </Field>
                )}

                {/* Read‑only fields from menu */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Item name">
                        <Input
                            value={form.name}
                            disabled
                            className="bg-[#FCF9F5] border-[#E5DDD0] text-[#1A2822] cursor-not-allowed opacity-70"
                        />
                    </Field>
                    <Field label="Category">
                        <Input
                            value={form.category}
                            disabled
                            className="bg-[#FCF9F5] border-[#E5DDD0] text-[#1A2822] cursor-not-allowed opacity-70"
                        />
                    </Field>
                </div>

                <Field label="Selling price (from menu / variant)">
                    <Input
                        value={form.sellingPrice !== undefined ? `₹${form.sellingPrice}` : "—"}
                        disabled
                        className="bg-[#FCF9F5] border-[#E5DDD0] text-[#1A2822] cursor-not-allowed opacity-70"
                    />
                </Field>

                <hr className="border-[#E5DDD0]" />

                {/* Inventory‑managed fields */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Unit" error={errors.unit}>
                        <Select
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent"
                        >
                            {UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Current stock" error={errors.currentStock}>
                        <Input
                            type="number"
                            min={0}
                            value={form.currentStock}
                            onChange={(e) =>
                                setForm({ ...form, currentStock: Number(e.target.value) })
                            }
                            className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent"
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Minimum stock" error={errors.minimumStock}>
                        <Input
                            type="number"
                            min={0}
                            value={form.minimumStock}
                            onChange={(e) =>
                                setForm({ ...form, minimumStock: Number(e.target.value) })
                            }
                            className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent"
                        />
                    </Field>
                    <Field label="Purchase price" error={errors.purchasePrice}>
                        <Input
                            type="number"
                            min={0}
                            value={form.purchasePrice ?? ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    purchasePrice: e.target.value ? Number(e.target.value) : undefined,
                                })
                            }
                            className="border-[#E5DDD0] bg-white text-[#1A2822] focus:ring-2 focus:ring-[#2B6B4B] focus:border-transparent"
                        />
                    </Field>
                </div>

                {isEditing && (
                    <p className="text-xs text-[#6B7A73]">
                        Quantity is locked here — use "Update stock" from the list to add, adjust, or record wastage
                        so every change stays in the transaction history.
                    </p>
                )}
            </div>
        </Modal>
    );
}