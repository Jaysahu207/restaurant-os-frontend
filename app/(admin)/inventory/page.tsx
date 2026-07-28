"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  X,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast as hotToast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import InventorySkeleton from "@/components/skeleton/InventorySkeleton";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  normalizeItem,
  type InventoryItem,
} from "@/hooks/useInventory";

const CATEGORIES = [
  "All",
  "Vegetables",
  "Meat",
  "Dairy",
  "Bakery",
  "Condiments",
  "Beverages",
  "Other",
];

// Toast component (unchanged)
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-white ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
    >
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

export default function InventoryPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [sortField, setSortField] = useState<"name" | "quantity" | "costPerUnit" | "totalValue">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockAction, setStockAction] = useState<"add" | "remove">("add");
  const [stockQuantity, setStockQuantity] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Vegetables",
    quantity: 0,
    unit: "kg",
    reorderLevel: 0,
    costPerUnit: 0,
    supplier: "",
  });

  const { data: inventory = [], isLoading, error: queryError } = useInventory(restaurantId);
  const createMutation = useCreateInventoryItem(restaurantId);
  const updateMutation = useUpdateInventoryItem(restaurantId);
  const deleteMutation = useDeleteInventoryItem(restaurantId);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // Surface the 403 feature-lock toast once when the query error arrives
  useEffect(() => {
    const status = (queryError as any)?.response?.status;
    if (status === 403) {
      const backendMessage = (queryError as any)?.response?.data?.message || "Failed to load inventory";
      showToast(backendMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryError]);

  const filteredInventory = useMemo(() => {
    let result = inventory.filter((item: any) => {
      if (!item) return false;
      const name = (item.name || "").toLowerCase();
      const supplier = (item.supplier || "").toLowerCase();
      const searchLower = search.toLowerCase();
      const matchesSearch = name.includes(searchLower) || supplier.includes(searchLower);
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === "totalValue") {
        aVal = a.quantity * a.costPerUnit;
        bVal = b.quantity * b.costPerUnit;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [inventory, search, categoryFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  const lowStockItems = inventory.filter((item: any) => item.quantity <= item.reorderLevel);
  const totalValue = inventory.reduce((sum: number, item: any) => sum + item.quantity * item.costPerUnit, 0);

  const isDuplicateName = (name: string, excludeId?: string) => {
    return inventory.some(
      (item: any) => item.name.toLowerCase() === name.toLowerCase() && item._id !== excludeId,
    );
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Category", "Quantity", "Unit", "Reorder Level", "Cost/Unit", "Total Value", "Supplier"];
    const rows = filteredInventory.map((item: any) => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.reorderLevel,
      item.costPerUnit,
      (item.quantity * item.costPerUnit).toFixed(2),
      item.supplier || "",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported to CSV", "success");
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Vegetables",
      quantity: 0,
      unit: "kg",
      reorderLevel: 0,
      costPerUnit: 0,
      supplier: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Vegetables",
      quantity: 0,
      unit: "kg",
      reorderLevel: 0,
      costPerUnit: 0,
      supplier: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending || updateMutation.isPending) return;

    if (isDuplicateName(formData.name, editingItem?._id)) {
      showToast("Item already exists", "error");
      return;
    }

    try {
      let res;
      if (editingItem) {
        res = await updateMutation.mutateAsync({ itemId: editingItem._id, payload: formData });
      } else {
        res = await createMutation.mutateAsync(formData);
      }

      const item = normalizeItem(res);
      if (!item || !item._id) {
        showToast("Invalid server response", "error");
        return;
      }

      showToast(editingItem ? "Item updated successfully" : "Item added successfully", "success");
      closeModal();
    } catch (err) {
      console.error(err);
      showToast("Failed to save item", "error");
    }
  };

  const openStockModal = (item: InventoryItem, action: "add" | "remove") => {
    setSelectedItem(item);
    setStockAction(action);
    setStockQuantity(0);
    setStockModalOpen(true);
  };

  const handleStockAdjust = async () => {
    if (!selectedItem) return;

    const newQuantity =
      stockAction === "add"
        ? selectedItem.quantity + stockQuantity
        : selectedItem.quantity - stockQuantity;

    if (newQuantity < 0) {
      showToast("Cannot remove more than available quantity", "error");
      return;
    }

    try {
      const res = await updateMutation.mutateAsync({
        itemId: selectedItem._id,
        payload: { ...selectedItem, quantity: newQuantity },
      });

      const updatedItem = normalizeItem(res);
      if (!updatedItem) {
        showToast("Invalid server response", "error");
        return;
      }

      setStockModalOpen(false);
      setSelectedItem(null);
      showToast("Stock updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Stock update failed", "error");
    }
  };

  const handleDeleteClick = (_id: string) => {
    setItemToDelete(_id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete, {
      onSuccess: () => showToast("Item deleted", "success"),
      onError: (err) => {
        console.error("Delete error:", err);
        showToast("Failed to delete item", "error");
      },
      onSettled: () => {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
      },
    });
  };

  if (isLoading) {
    return <InventorySkeleton />;
  }

  const lockedStatus = (queryError as any)?.response?.status;
  if (lockedStatus === 403) {
    const backendMessage = (queryError as any)?.response?.data?.message || "Failed to load inventory";
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white border rounded-2xl shadow-sm p-8 max-w-md text-center">
          <AlertTriangle className="w-14 h-14 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Feature Not Available</h2>
          <p className="text-gray-600 mt-3">{backendMessage}</p>
          <button
            onClick={() => router.push("/subscription")}
            className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6  mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Low Stock Alert</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {lowStockItems.length} item(s) are below reorder level. Please restock soon.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your restaurant's inventory and stock levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={inventory.length} icon={Package} color="bg-blue-500" />
        <StatCard label="Low Stock Items" value={lowStockItems.length} icon={AlertTriangle} color="bg-yellow-500" />
        <StatCard label="Total Value" value={`₹${totalValue.toFixed(2)}`} icon={TrendingUp} color="bg-green-500" />
        <StatCard
          label="Categories"
          value={new Set(inventory.map((i: any) => i.category)).size}
          icon={Filter}
          color="bg-purple-500"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-md"
          >
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or supplier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {(search || categoryFilter !== "All") && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                  Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("quantity")}>
                  Quantity {sortField === "quantity" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Reorder Level</th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("costPerUnit")}>
                  Cost/Unit {sortField === "costPerUnit" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("totalValue")}>
                  Total Value {sortField === "totalValue" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item: any) => {
                  const isLowStock = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item._id} className={`hover:bg-gray-50 ${isLowStock ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                      <td className="px-4 py-3">{item.reorderLevel}</td>
                      <td className="px-4 py-3">₹{item.costPerUnit}</td>
                      <td className="px-4 py-3 font-medium">₹{(item.quantity * item.costPerUnit).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{item.supplier || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openStockModal(item, "add")} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Add Stock">
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => openStockModal(item, "remove")} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Remove Stock">
                            <TrendingDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(item._id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <InventoryFormModal
          formData={formData}
          setFormData={setFormData}
          editingItem={editingItem}
          onClose={closeModal}
          onSubmit={handleSubmit}
          categories={CATEGORIES.filter((c) => c !== "All")}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {stockModalOpen && selectedItem && (
        <StockAdjustModal
          item={selectedItem}
          action={stockAction}
          quantity={stockQuantity}
          setQuantity={setStockQuantity}
          onConfirm={handleStockAdjust}
          onClose={() => setStockModalOpen(false)}
        />
      )}
      {deleteConfirmOpen && (
        <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmOpen(false)} />
      )}
    </div>
  );
}


function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function InventoryFormModal({ formData, setFormData, editingItem, onClose, onSubmit, categories, isSaving }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md  bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{editingItem ? "Edit Item" : "Add Item"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Item Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Quantity *</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label>Unit *</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Reorder Level *</label>
              <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label>Cost per Unit ($) *</label>
              <input type="number" name="costPerUnit" value={formData.costPerUnit} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label>Supplier</label>
            <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update Item"
              ) : (
                "Add Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockAdjustModal({ item, action, quantity, setQuantity, onConfirm, onClose }: any) {
  const isAdd = action === "add";
  const newQuantity = isAdd ? item.quantity + quantity : item.quantity - quantity;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">{isAdd ? "Add Stock" : "Remove Stock"}</h3>
          <p>Current: {item.quantity} {item.unit}</p>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p>
            New quantity: <strong>{newQuantity} {item.unit}</strong>
          </p>
          {!isAdd && quantity > item.quantity && (
            <p className="text-red-600 text-sm">Amount exceeds current stock.</p>
          )}
        </div>
        <div className="border-t p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!isAdd && quantity > item.quantity}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/ backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold">Confirm Delete</h3>
        <p className="text-gray-600 my-4">
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}