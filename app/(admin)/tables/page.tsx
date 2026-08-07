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
  ShoppingBag,
  Truck,
  UserPlus,
} from "lucide-react";

import QRCode from "react-qr-code";

import { toPng } from "html-to-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTables,
  createTable,
  deleteTable,
  updateTable,
  assignWaiterToTable,
  removeWaiterFromTable,
} from "@/services/tableServices";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/useAuthStore";
import TableQRSkeleton from "@/components/skeleton/TableQRSkeleton";
import { getStaffByRole, getWaiters } from "@/services/staffService";

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [formData, setFormData] = useState({ number: "", capacity: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWaiterName, setSelectedWaiterName] = useState("");
  const [copiedType, setCopiedType] = useState("");

  const restaurantId = useAuthStore((state) => state.restaurant?._id);
  const slug = useAuthStore((state) => state.restaurant?.slug) || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["tables"],
    queryFn: () => getTables(restaurantId),
  });

  const tables = data?.data || [];

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

  const { data: waiters = [] } = useQuery({
    queryKey: ["waiters"],
    queryFn: () => getStaffByRole("waiter"),
  });

  // console.log("Waiters:", waiters);
  console.log("Tables :", tables);

  const assignWaiterMutation = useMutation({
    mutationFn: ({
      tableId,
      waiterId,
    }: {
      tableId: string;
      waiterId: string;
    }) => assignWaiterToTable(tableId, waiterId),

    onSuccess: () => {
      toast.success("Waiter assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      closeAssignModal();
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to assign waiter");
    },
  });
  const removeWaiterMutation = useMutation({
    mutationFn: (tableId: string) => removeWaiterFromTable(tableId),

    onSuccess: () => {
      toast.success("Waiter removed successfully");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to remove waiter"
      );
    },
  });

  const copyLink = async (url: string, type: "takeaway" | "delivery") => {
    await navigator.clipboard.writeText(url);
    setCopiedType(type);
    toast.success("Copied!");
    setTimeout(() => setCopiedType(""), 2000);
  };

  const getQRUrl = (tableNumber: number) => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/menu/${slug}?table=${tableNumber}`;
  };
  const getTakeawayQRUrl = () => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/menu/${slug}?mode=takeaway`;
  };
  const getDeliveryQRUrl = () => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/menu/${slug}?mode=delivery`;
  };

  const downloadHighQualityQR = async (elementId: string, fileName: string) => {
    try {
      const element = document.getElementById(elementId);

      if (!element) return;

      toast.loading("Downloading high-quality QR...", {
        id: "qr-download",
      });

      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 8,
        backgroundColor: "#ffffff",
        canvasWidth: 4096,
        canvasHeight: 4096,
        quality: 1,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      link.click();

      toast.success("QR downloaded", {
        id: "qr-download",
      });
    } catch (err) {
      console.error(err);

      toast.error("Download failed", {
        id: "qr-download",
      });
    }
  };

  const downloadTableQR = useCallback(
    async (tableId: string, tableNumber: number) => {
      await downloadHighQualityQR(`qr-${tableId}`, `table-${tableNumber}-qr`);
    },
    [],
  );

  const downloadTakeawayQR = useCallback(async () => {
    await downloadHighQualityQR("takeaway-qr", `${slug}-takeaway-qr`);
  }, [slug]);

  const downloadDeliveryQR = useCallback(async () => {
    await downloadHighQualityQR("delivery-qr", `${slug}-delivery-qr`);
  }, [slug]);

  const copyQRUrl = useCallback(async (tableNumber: number, id: string) => {
    const url = getQRUrl(tableNumber);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("QR URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  const openAssignModal = (table: any) => {
    setSelectedTable(table);
    const currentWaiterId = table.assignedWaiter?._id || "";
    setSelectedWaiter(currentWaiterId);
    setSelectedWaiterName(table.assignedWaiter?.name || "");
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedTable(null);
    setSelectedWaiter("");
  };
  const handleAssignWaiter = () => {
    if (!selectedTable) return;

    assignWaiterMutation.mutate({
      tableId: selectedTable._id,
      waiterId: selectedWaiter || "",
    });
  };
  if (isLoading) {
    return <TableQRSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load tables. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-5">
      <div className="mx-auto space-y-4 md:space-y-5">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              QR & Table Management
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Generate and manage QR codes for dine-in, takeaway and delivery
              ordering.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-linear-to-br from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <Plus size={16} />
            Add New Table
          </button>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <TableIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No tables yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by adding your first table
            </p>
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={16} />
              Add Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {tables.map((table: any) => (
              <div
                key={table._id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 hover:border-orange-200"
              >
                {/* Card Header */}
                <div className="bg-linear-to-r from-gray-800 to-gray-900 px-3.5 py-3 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TableIcon size={16} className="text-orange-400" />
                        <h3 className="font-bold text-base">
                          Table {table.tableNumber}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-gray-300 text-xs">
                        <Users size={12} />
                        <span>Capacity: {table.capacity} guests</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => openEditModal(table)}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Edit table"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() =>
                          deleteTableHandler(table._id, table.tableNumber)
                        }
                        className="p-1 rounded-lg bg-white/10 hover:bg-red-500/50 transition-colors"
                        title="Delete table"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-3 flex flex-col items-center border-b border-gray-100">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-white rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div
                      id={`qr-${table._id}`}
                      className="relative bg-white p-2 rounded-lg shadow-sm"
                    >
                      <QRCode
                        value={getQRUrl(table.tableNumber)}
                        size={120}
                        bgColor="#FFFFFF"
                        fgColor="#111827"
                        level="H"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                    <QrCode size={10} />
                    Scan to view menu
                  </p>
                </div>

                {/* Actions */}
                <div className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() =>
                      downloadTableQR(table._id, table.tableNumber)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-xs"
                  >
                    <Download size={13} />
                    Download
                  </button>
                  <button
                    onClick={() => copyQRUrl(table.tableNumber, table._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors font-medium text-xs"
                  >
                    {copiedId === table._id ? (
                      <>
                        <Check size={13} className="text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
                <div className="px-3 py-3 border-t border-gray-100">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-500 shrink-0">
                        Waiter
                      </span>

                      {table.assignedWaiter ? (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1 min-w-0 max-w-full">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {table.assignedWaiter.name.charAt(0).toUpperCase()}
                          </div>

                          <span
                            className="text-sm font-medium text-gray-700 truncate"
                            title={table.assignedWaiter.name}
                          >
                            {table.assignedWaiter.name}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              toast.custom((t) => (
                                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80">
                                  <h3 className="font-semibold text-gray-900">
                                    Remove Waiter?
                                  </h3>

                                  <p className="text-sm text-gray-500 mt-1">
                                    Unassign{" "}
                                    <span className="font-medium text-gray-700">
                                      {table.assignedWaiter.name}
                                    </span>{" "}
                                    from Table {table.tableNumber}?
                                  </p>

                                  <div className="flex justify-end gap-2 mt-4">
                                    <button
                                      onClick={() => toast.dismiss(t.id)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      onClick={() => {
                                        removeWaiterMutation.mutate(table._id);
                                        toast.dismiss(t.id);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ));
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            title="Remove assignment"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Not assigned
                        </span>
                      )}
                    </div>

                    {/* Right Section */}
                    <button
                      onClick={() => openAssignModal(table)}
                      className="
        w-full
        sm:w-auto
        flex
        items-center
        justify-center
        gap-1
        px-3
        py-2
        rounded-lg
        border
        border-orange-200
        bg-orange-50
        text-sm
        font-medium
        text-orange-600
        hover:bg-orange-100
        transition
      "
                    >
                      {table.assignedWaiter ? (
                        <>
                          <Edit size={14} />
                          Change
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Assign Waiter
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Online Ordering QR Codes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Online Ordering QR Codes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Share these QR codes or links to let customers place takeaway and
              delivery orders directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Takeaway QR */}
            <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Takeaway QR
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Customers order for pickup
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div
                  id="takeaway-qr"
                  className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                >
                  <QRCode
                    value={getTakeawayQRUrl()}
                    size={130}
                    bgColor="#FFFFFF"
                    fgColor="#111827"
                    level="H"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadTakeawayQR}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition text-sm font-medium"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  onClick={() => copyLink(getTakeawayQRUrl(), "takeaway")}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg transition text-sm font-medium"
                >
                  {copiedType === "takeaway" ? (
                    <>
                      <Check size={15} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Delivery QR */}
            <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Delivery QR
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Customers order home delivery
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div
                  id="delivery-qr"
                  className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                >
                  <QRCode
                    value={getDeliveryQRUrl()}
                    size={130}
                    bgColor="#FFFFFF"
                    fgColor="#111827"
                    level="H"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadDeliveryQR}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition text-sm font-medium"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  onClick={() => copyLink(getDeliveryQRUrl(), "delivery")}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg transition text-sm font-medium"
                >
                  {copiedType === "delivery" ? (
                    <>
                      <Check size={15} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {editingTable
                  ? `Edit Table ${editingTable.tableNumber}`
                  : "Add New Table"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="number"
                  placeholder="e.g., 1, 2, 3..."
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                  required
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (guests)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 2, 4, 6..."
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                  required
                  min="1"
                  step="1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingTable ? "Update Table" : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 animate-in fade-in duration-200"
          onClick={closeAssignModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Assign Waiter
              </h2>
              <button
                onClick={closeAssignModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current assignment */}
              {selectedTable?.assignedWaiter && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-sm font-bold">
                    {selectedTable.assignedWaiter.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Currently assigned
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedTable.assignedWaiter.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Waiter selection with search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Choose a waiter
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <input
                    list="waiter-list"
                    value={selectedWaiterName || ""}
                    onChange={(e) => {
                      const name = e.target.value;
                      const found = waiters.find((w: any) => w.name === name);
                      setSelectedWaiter(found ? found._id : "");
                      setSelectedWaiterName(name);
                    }}
                    placeholder="Type or select a waiter"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                  />
                  <datalist id="waiter-list">
                    {waiters.map((w: any) => (
                      <option key={w._id} value={w.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignWaiter}
                  disabled={!selectedWaiter || assignWaiterMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {assignWaiterMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Waiter"
                  )}
                </button>
              </div>

              {/* Remove assignment – only shown when a waiter is assigned */}
              {selectedTable?.assignedWaiter && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${selectedTable.assignedWaiter.name} from this table?`,
                      )
                    ) {
                      assignWaiterMutation.mutate({
                        tableId: selectedTable._id,
                        waiterId: "",
                      });
                    }
                  }}
                  className="w-full mt-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
