// types/inventory.ts

export type StockMovementType = "stock_in" | "adjustment" | "wastage" | "sale";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryCategory {
  _id: string;
  name: string;
}
// types/inventory.ts

export interface InventoryItem {
  _id: string;
  menuItemId: string;
  variantId?: string;      // optional if no variant
  variantName?: string;    // optional, display name of variant
  name: string;
  category: string;
  sellingPrice: number;
  image?: string;
  totalValue: number;
  sku?: string;
  currentStock: number;
  minimumStock: number;
  purchasePrice: number;
  unit: string;
  isActive: boolean;
  // populated menu item object when needed
  menuItem?: any;
}

export const UNITS = [
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

export type InventoryUnit = (typeof UNITS)[number];

// Form values used in the inventory item form modal
// Includes both read-only (from menu) and editable fields
export interface InventoryItemFormValues {
  menuItemId: string;
  variantId?: string | null;
  variantName?: string | null;
  name: string;
  category: string;
  image?: string;
  sellingPrice?: number;
  unit: string;
  currentStock: number;
  minimumStock: number;
  purchasePrice?: number;
}

export interface UpdateStockPayload {
  quantity: number;
  type: StockMovementType;
  note?: string;
}

export interface InventoryTransaction {
  _id: string;
  variantName?: string;
  inventoryId: {
    _id: string;
    name: string;
    sku: string;
    unit: InventoryUnit;
  } | null;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  note: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface InventoryTransactionsParams {
  page?: number;
  limit?: number;
  type?: StockMovementType;
  inventoryId?: string;
  startDate?: string;
  endDate?: string;
}

export interface InventoryTransactionsResponse {
  transactions: InventoryTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export interface InventorySummary {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: InventoryItem[];
  recentTransactions: InventoryTransaction[];
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock <= 0) {
    return "out_of_stock";
  }
  if (item.currentStock <= item.minimumStock) {
    return "low_stock";
  }
  return "in_stock";
}