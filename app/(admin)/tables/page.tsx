"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Download,
  Trash2,
  Edit,
  X,
  Copy,
  Check,
  Users,
  Table as TableIcon,
  Loader2,
  QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTables,
  createTable,
  deleteTable,
  updateTable,
} from "@/services/tableServices";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/useAuthStore";

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [formData, setFormData] = useState({ number: "", capacity: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const restaurantId = useAuthStore((state) => state.restaurant?._id) || ""; // Get restaurant ID from auth store
  // Fetch Tables
  const { data, isLoading, error } = useQuery({
    queryKey: ["tables"],
    queryFn: () => getTables(restaurantId),
  });

  const tables = data?.data || [];

  // Create Table
  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create table");
    },
  });

  // Update Table
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update table");
    },
  });

  // Delete Table
  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete table");
    },
  });

  // Get QR URL
  //   const getQRUrl = (tableNumber: number) => {
  //     return `${process.env.NEXT_PUBLIC_FRONTEND_NETWORK_URL}/menu?table=${tableNumber}&restaurant=${restaurantId}`;
  //   };
  const getQRUrl = (tableNumber: number) => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_NETWORK_URL}/menu/${restaurantId}?table=${tableNumber}`;
  };
  // Download QR as PNG
  const downloadQR = useCallback(async (id: string, tableNumber: number) => {
    const element = document.getElementById(`qr-${id}`);
    if (!element) return;

    try {
      toast.loading("Generating QR code...", { id: "qr-download" });
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `table-${tableNumber}-qr.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR code downloaded!", { id: "qr-download" });
    } catch (error) {
      toast.error("Failed to download QR code", { id: "qr-download" });
    }
  }, []);

  // Copy QR URL to clipboard
  const copyQRUrl = useCallback(async (tableNumber: number, id: string) => {
    const url = getQRUrl(tableNumber);
    console.log(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("QR URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.number || !formData.capacity) {
      toast.error("Please fill all fields");
      return;
    }

    const tableNumber = Number(formData.number);
    const capacity = Number(formData.capacity);

    if (isNaN(tableNumber) || tableNumber <= 0) {
      toast.error("Table number must be a positive number");
      return;
    }

    if (isNaN(capacity) || capacity <= 0) {
      toast.error("Capacity must be a positive number");
      return;
    }

    if (editingTable) {
      updateMutation.mutate({
        id: editingTable._id,
        data: { tableNumber, capacity },
      });
    } else {
      createMutation.mutate({
        tableNumber,
        capacity,
        restaurantId,
      });
      console.log(tableNumber, capacity, restaurantId);
    }
  };

  const deleteTableHandler = (id: string, tableNumber: number) => {
    toast(
      (t) => (
        <div className="flex gap-2">
          <span>Delete Table {tableNumber}?</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteMutation.mutate(id);
            }}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      ),
      { duration: 5000 },
    );
  };

  const openAddModal = () => {
    setEditingTable(null);
    setFormData({ number: "", capacity: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (table: any) => {
    setEditingTable(table);
    setFormData({
      number: table.tableNumber.toString(),
      capacity: table.capacity.toString(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
    setFormData({ number: "", capacity: "" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading tables...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load tables. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Table & QR Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your restaurant tables and generate QR codes for menu
              access
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-br from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <Plus size={20} />
            Add New Table
          </button>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <TableIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tables yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first table
            </p>
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table: any) => (
              <div
                key={table._id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <TableIcon size={20} className="text-orange-400" />
                        <h3 className="font-bold text-xl">
                          Table {table.tableNumber}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-gray-300 text-sm">
                        <Users size={14} />
                        <span>Capacity: {table.capacity} guests</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(table)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Edit table"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          deleteTableHandler(table._id, table.tableNumber)
                        }
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/50 transition-colors"
                        title="Delete table"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-5 flex flex-col items-center border-b border-gray-100">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div
                      id={`qr-${table._id}`}
                      className="relative bg-white p-3 rounded-xl shadow-sm"
                    >
                      <QRCode
                        value={getQRUrl(table.tableNumber)}
                        size={140}
                        bgColor="#FFFFFF"
                        fgColor="#1F2937"
                        level="H"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <QrCode size={12} />
                    Scan to view menu
                  </p>
                </div>

                {/* Actions */}
                <div className="p-4 flex justify-center gap-3">
                  <button
                    onClick={() => downloadQR(table._id, table.tableNumber)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => copyQRUrl(table.tableNumber, table._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                  >
                    {copiedId === table._id ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {editingTable
                  ? `Edit Table ${editingTable.tableNumber}`
                  : "Add New Table"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="number"
                  placeholder="e.g., 1, 2, 3..."
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (guests)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 2, 4, 6..."
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  min="1"
                  step="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {editingTable ? "Update Table" : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
