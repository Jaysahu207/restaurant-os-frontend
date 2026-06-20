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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-orange-500" />
            Table Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real‑time overview of all tables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
          >
            {viewMode === "grid" ? (
              <List className="w-5 h-5" />
            ) : (
              <LayoutGrid className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => fetchTables(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Tables</p>
        </div>
        <div className="bg-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {stats.available}
          </p>
          <p className="text-xs text-emerald-600">Available</p>
        </div>
        <div className="bg-rose-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-700">{stats.occupied}</p>
          <p className="text-xs text-rose-600">Occupied</p>
        </div>
        <div className="bg-amber-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.reserved}</p>
          <p className="text-xs text-amber-600">Reserved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search table number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-xl w-full sm:w-64 text-sm"
        />
        <div className="flex gap-2">
          {(["all", "available", "occupied", "reserved"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
                  filterStatus === status
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Tables Grid / List */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No tables match the criteria</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const statusStyle = getStatusUI(table.status);
            const totalItems = getTotalItems(table.currentOrder);
            return (
              <div
                key={table.tableNumber}
                onClick={() => {
                  if (table.status === "available" && onTableClick) {
                    onTableClick(table);
                  }
                }}
                className={`rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 ${statusStyle.bg} ${statusStyle.border}`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">
                        Table {table.tableNumber}
                      </h3>
                      <div
                        className={`flex items-center gap-1 mt-1 text-sm ${statusStyle.text}`}
                      >
                        {statusStyle.icon}
                        <span>{statusStyle.label}</span>
                      </div>
                    </div>
                    {table.status !== "available" && (
                      <button
                        onClick={() => freeTable(table.tableNumber)}
                        disabled={actionLoading}
                        className="text-red-500 hover:bg-red-50 p-1 rounded-full transition"
                        title="Free table"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {table.currentOrder && (
                    <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-xl p-3 text-sm space-y-1">
                      <p className="font-semibold">
                        Order #{table.currentOrder.orderNumber}
                      </p>
                      <p className="capitalize">
                        Status: {table.currentOrder.status}
                      </p>
                      <p>Items: {totalItems}</p>
                      {table.currentOrder.totalAmount && (
                        <p className="font-medium">
                          ₹{table.currentOrder.finalAmount}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowModal(true);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-orange-600 text-xs font-medium bg-orange-50 py-1.5 rounded-lg"
                      >
                        <Eye className="w-3 h-3" /> View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="divide-y">
            {filteredTables.map((table) => {
              const statusStyle = getStatusUI(table.status);
              const totalItems = getTotalItems(table.currentOrder);
              return (
                <div
                  key={table.tableNumber}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                      {table.tableNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Table {table.tableNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      {table.currentOrder && (
                        <p className="text-xs text-gray-500 mt-1">
                          Order #{table.currentOrder.orderNumber} • {totalItems}{" "}
                          items
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {table.currentOrder && (
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {table.status !== "available" && (
                      <button
                        onClick={() => freeTable(table.tableNumber)}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
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
