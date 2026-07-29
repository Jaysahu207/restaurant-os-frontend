"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { PublicAPI } from "@/config/axios";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  UtensilsCrossed,
  RefreshCw,
  Eye,
  XCircle,
  Loader2,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";

type TableStatus = "available" | "occupied" | "reserved";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderSummary = {
  _id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  createdAt?: string;
  totalAmount?: number;
  sgstAmount?: number;
  cgstAmount?: number;
  finalAmount?: number;
};

type Table = {
  tableNumber: number;
  status: TableStatus;
  currentOrder?: OrderSummary | null;
  capacity?: number;
  occupiedAt?: string;
};

interface TableManagementProps {
  restaurantId: string;
  onTableClick?: (table: Table) => void;
}

export default function TableManagement({
  restaurantId,
  onTableClick,
}: TableManagementProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TableStatus | "all">("all");

  // Helper: total quantity of items in an order
  const getTotalItems = (order?: OrderSummary | null): number => {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // WebSocket connection
  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      // console.log("Table Mgmt Socket connected");
      socket.emit("joinRestaurant", restaurantId);
    });

    socket.on("TABLE_UPDATED", (updatedTable: Table) => {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === updatedTable.tableNumber ? updatedTable : t,
        ),
      );
    });

    socket.on("ORDER_UPDATED", () => {
      fetchTables(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId]);

  const fetchTables = useCallback(
    async (showLoading = false) => {
      if (showLoading) setRefreshing(true);
      try {
        const res = await PublicAPI.get(`/api/tables`, {
          params: { restaurantId },
        });
        setTables(res.data);
      } catch (err) {
        console.error("Failed to fetch tables", err);
        toast.error("Could not load tables");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [restaurantId],
  );

  useEffect(() => {
    fetchTables();
    const interval = setInterval(() => fetchTables(false), 10000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const freeTable = async (tableNumber: number) => {
    if (
      !confirm(`Free Table ${tableNumber}? This will remove the current order.`)
    )
      return;
    setActionLoading(true);
    try {
      await PublicAPI.put(`/api/tables/${tableNumber}/free`, { restaurantId });
      toast.success(`Table ${tableNumber} is now available`);
      fetchTables(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to free table");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusUI = (status: TableStatus) => {
    switch (status) {
      case "available":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          icon: <CheckCircle className="w-5 h-5" />,
          label: "Available",
        };
      case "occupied":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700",
          icon: <AlertCircle className="w-5 h-5" />,
          label: "Occupied",
        };
      case "reserved":
        return {
          bg: "bg-amber-100",
          border: "border-amber-200",
          text: "text-amber-700",
          icon: <Clock className="w-5 h-5" />,
          label: "Reserved",
        };
    }
  };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.tableNumber.toString().includes(searchTerm);
    const matchesStatus =
      filterStatus === "all" || table.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {/* Left Side */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
            <UtensilsCrossed className="h-5 w-5 text-orange-600" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">
              Table Management
            </h1>

            <p className="text-[11px] text-gray-500 sm:text-xs">
              Real-time overview of all restaurant tables
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "list" : "grid")
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
            title={viewMode === "grid" ? "List View" : "Grid View"}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4 text-gray-600" />
            ) : (
              <LayoutGrid className="h-4 w-4 text-gray-600" />
            )}
          </button>

          <button
            onClick={() => fetchTables(true)}
            disabled={refreshing}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs sm:text-sm font-medium shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 shadow-sm">
          <p className="text-center text-base sm:text-lg lg:text-xl font-bold text-blue-700 leading-none">
            {stats.total}
          </p>
          <p className="mt-1 truncate text-center text-[9px] sm:text-[10px] lg:text-xs font-medium text-blue-600">
            Total Tables
          </p>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 shadow-sm">
          <p className="text-center text-base sm:text-lg lg:text-xl font-bold text-emerald-700 leading-none">
            {stats.available}
          </p>
          <p className="mt-1 truncate text-center text-[9px] sm:text-[10px] lg:text-xs font-medium text-emerald-600">
            Available
          </p>
        </div>

        <div className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 shadow-sm">
          <p className="text-center text-base sm:text-lg lg:text-xl font-bold text-rose-700 leading-none">
            {stats.occupied}
          </p>
          <p className="mt-1 truncate text-center text-[9px] sm:text-[10px] lg:text-xs font-medium text-rose-600">
            Occupied
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 shadow-sm">
          <p className="text-center text-base sm:text-lg lg:text-xl font-bold text-amber-700 leading-none">
            {stats.reserved}
          </p>
          <p className="mt-1 truncate text-center text-[9px] sm:text-[10px] lg:text-xs font-medium text-amber-600">
            Reserved
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative w-full md:w-64 lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "available", "occupied", "reserved"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`h-8 rounded-full px-3 text-xs font-medium capitalize transition-all duration-200 ${filterStatus === status
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* ----- TABLES ----- */}
      {filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
          <UtensilsCrossed className="h-12 w-12 mb-2 opacity-40" />
          <p className="text-sm font-medium">No tables match the criteria</p>
          <p className="text-xs">Try adjusting your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredTables.map((table) => {
            const statusStyle = getStatusUI(table.status);
            const totalItems = getTotalItems(table.currentOrder);
            const isAvailable = table.status === 'available';

            return (
              <div
                key={table.tableNumber}
                onClick={() => {
                  if (isAvailable && onTableClick) {
                    onTableClick(table);
                  }
                }}
                className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${statusStyle.bg} ${statusStyle.border}`}
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Table {table.tableNumber}
                      </h3>
                      <div
                        className={`flex items-center gap-1 text-xs font-medium ${statusStyle.text}`}
                      >
                        {statusStyle.icon}
                        <span>{statusStyle.label}</span>
                      </div>
                    </div>
                    {!isAvailable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          freeTable(table.tableNumber);
                        }}
                        disabled={actionLoading}
                        className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition"
                        title="Free table"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {table.currentOrder && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 text-xs space-y-1 border border-gray-200/60">
                      <p className="font-semibold text-gray-700">
                        Order #{table.currentOrder.orderNumber}
                      </p>
                      <p className="text-gray-500 capitalize">
                        {table.currentOrder.status}
                      </p>
                      <p className="text-gray-500">
                        Items: {totalItems}
                        {table.currentOrder.finalAmount && (
                          <span className="ml-2 font-medium text-orange-600">
                            ₹{table.currentOrder.finalAmount}
                          </span>
                        )}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTable(table);
                          setShowModal(true);
                        }}
                        className="mt-1 w-full flex items-center justify-center gap-1 text-orange-600 text-xs font-medium bg-orange-50/80 py-1 rounded-lg hover:bg-orange-100 transition"
                      >
                        <Eye className="h-3 w-3" /> View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ----- LIST VIEW -----
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredTables.map((table) => {
              const statusStyle = getStatusUI(table.status);
              const totalItems = getTotalItems(table.currentOrder);
              const isAvailable = table.status === 'available';

              return (
                <div
                  key={table.tableNumber}
                  className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700">
                      {table.tableNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          Table {table.tableNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      {table.currentOrder && (
                        <p className="text-xs text-gray-500">
                          Order #{table.currentOrder.orderNumber} · {totalItems}{' '}
                          items
                          {table.currentOrder.finalAmount && (
                            <span className="ml-2 font-medium text-orange-600">
                              ₹{table.currentOrder.finalAmount}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {table.currentOrder && (
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {!isAvailable && (
                      <button
                        onClick={() => freeTable(table.tableNumber)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Order Details Modal */}
      {showModal && selectedTable && selectedTable.currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Table</span>
                  <span className="font-medium">
                    {selectedTable.tableNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number</span>
                  <span className="font-medium">
                    #{selectedTable.currentOrder.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="capitalize">
                    {selectedTable.currentOrder.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items</span>
                  <span>{getTotalItems(selectedTable.currentOrder)}</span>
                </div>

                {/* Detailed items list */}
                {selectedTable.currentOrder.items &&
                  selectedTable.currentOrder.items.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-sm font-semibold mb-2">Order Items</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {selectedTable.currentOrder.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedTable.currentOrder.totalAmount && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">
                      ₹{selectedTable.currentOrder.totalAmount}
                    </span>
                  </div>
                )}
                {selectedTable.currentOrder.sgstAmount &&
                  selectedTable.currentOrder.cgstAmount && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500">SGST</span>
                      <span>₹{selectedTable.currentOrder.sgstAmount}</span>
                    </div>
                  )}
                {selectedTable.currentOrder.cgstAmount && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">CGST</span>
                    <span>₹{selectedTable.currentOrder.cgstAmount}</span>
                  </div>
                )}

                {selectedTable.currentOrder.finalAmount && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Final Amount</span>
                    <span className="font-bold">
                      ₹{selectedTable.currentOrder.finalAmount}
                    </span>
                  </div>
                )}
                {selectedTable.currentOrder.createdAt && (
                  <div className="text-xs text-gray-400">
                    Since{" "}
                    {new Date(
                      selectedTable.currentOrder.createdAt,
                    ).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    freeTable(selectedTable.tableNumber);
                    setShowModal(false);
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl"
                >
                  Free Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
