"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Phone,
  Eye,
  X,
  Mail,
  RefreshCw,
  Filter,
  ChevronDown,
  User,
  ShoppingBag,
  DollarSign,
  Clock,
  Printer,
  Calendar,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  getCustomers,
  getCustomerById,
  deleteCustomer,
  getCustomerHistory,
} from "@/services/customerDetail";
import toast from "react-hot-toast";
import { debounce } from "lodash"; // or implement a simple debounce
import { useAuthStore } from "@/store/useAuthStore";

// ==================== Types ====================
interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  lastOrder: string;
  totalOrders?: number;
  totalSpent?: number;
  lastVisit?: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

// ==================== Main Component ====================
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [lastSearched, setLastSearched] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD for filtering customers by last order date
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [orderDateFilter, setOrderDateFilter] = useState(""); // For filtering orders within modal
  const [modalLoading, setModalLoading] = useState(false);

  const { restaurant } = useAuthStore();

  // Debounced search handler
  const debouncedSearch = useMemo(() => {
    return debounce((value: string) => {
      const trimmed = value.trim();

      if (trimmed.length < 2 && trimmed.length !== 0) return;

      setSearch((prev) => {
        if (prev === trimmed) return prev; // prevent duplicate
        return trimmed;
      });
    }, 500);
  }, []); // ✅ EMPTY dependency

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); // instant UI update
    debouncedSearch(value); // delayed API
  };
  // Load customers with optional date filter
  const loadCustomers = useCallback(async () => {
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const data = await getCustomers(restaurant._id, "", 1, 1000); // 👈 no search, no date
      setCustomers(data);
      setFilteredCustomers(data); // 👈 important
    } catch (err) {
      console.error("Failed to load customers:", err);
      toast.error("Could not load customers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };
  useEffect(() => {
    let filtered = [...customers];

    // 🔍 Search filter (name + phone)
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search),
      );
    }

    // 📅 Date filter (lastVisit)
    if (dateFilter) {
      filtered = filtered.filter((c) => {
        if (!c.lastVisit) return false;
        const d = new Date(c.lastVisit);
        const customerDate = formatLocalDate(d);

        return customerDate === dateFilter;
      });
    }

    setFilteredCustomers(filtered);
  }, [search, dateFilter, customers]);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // Open customer order history
  const openHistory = async (customer: Customer) => {
    try {
      setModalLoading(true);
      const historyData = await getCustomerHistory(customer._id);
      console.log("backend data", historyData);
      setSelectedCustomer(historyData.customer);
      setOrders(historyData.history || []);
      setAnalytics(historyData.analytics || null);
      setOrderDateFilter(""); // Reset order date filter
      setHistoryModalOpen(true);
    } catch (err) {
      console.error("Failed to load customer details:", err);
      toast.error("Could not load customer history");
    } finally {
      setModalLoading(false);
    }
  };
  // console.log("Customer Data -> ", selectedCustomer, orders);
  const closeHistory = () => {
    setHistoryModalOpen(false);
    setSelectedCustomer(null);
    setOrders([]);
    setOrderDateFilter("");
  };

  // Filter orders within modal by date
  const filteredOrders = useMemo(() => {
    if (!orderDateFilter) return orders;
    return orders.filter((order) => {
      const d = new Date(order.createdAt);
      const orderDate = formatLocalDate(d);
      return orderDate === orderDateFilter;
    });
  }, [orders, orderDateFilter]);

  // Calculate stats for customer card
  const customerStats = useMemo(() => {
    const total = customers.length;
    const totalSpent = customers.reduce(
      (sum, c) => sum + (c.totalSpent || 0),
      0,
    );
    const avgOrders =
      total > 0
        ? customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / total
        : 0;
    return { total, totalSpent, avgOrders };
  }, [customers]);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setInputValue("");
    // Trigger immediate search clear
    debouncedSearch("");
  };

  // Print order history for selected customer
  const handlePrintHistory = () => {
    const printContent = document.getElementById("customer-history-print");
    if (printContent && selectedCustomer) {
      const WindowPrt = window.open(
        "",
        "",
        "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0",
      );
      if (WindowPrt) {
        WindowPrt.document.write(`
          <html>
            <head>
              <title>Customer History - ${selectedCustomer.name}</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 20px; }
                .header { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; text-align: right; }
              </style>
            </head>
            <body>${printContent.innerHTML}</body>
          </html>
        `);
        WindowPrt.document.close();
        WindowPrt.focus();
        WindowPrt.print();
        WindowPrt.close();
      }
    }
  };

  if (loading && !refreshing) {
    return <CustomersSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Customer Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your customer base
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Customers"
          value={customerStats.total}
          icon={User}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${customerStats.totalSpent.toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          label="Avg. Orders/Customer"
          value={customerStats.avgOrders.toFixed(1)}
          icon={ShoppingBag}
          color="bg-purple-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={inputValue}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border text-gray-700 border-gray-300 rounded-lg"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* Calendar Icon */}
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

              {/* Date Picker */}
              <DatePicker
                selected={orderDateFilter ? new Date(orderDateFilter) : null}
                onChange={(date: Date | null) =>
                  setOrderDateFilter(date ? formatLocalDate(date) : "")
                }
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
                className="
        w-[160px]
        pl-9 pr-3 py-2
        text-sm text-gray-900
        bg-white
        border border-gray-300
        rounded-xl
        shadow-sm
        outline-none
        transition-all
        focus:ring-2 focus:ring-indigo-500
        focus:border-indigo-500
        hover:border-gray-400
      "
                popperClassName="z-50"
              />
            </div>

            {/* Clear Button */}
            {orderDateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="
        p-2 rounded-lg
        text-gray-400
        hover:text-red-500
        hover:bg-red-50
        transition
      "
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters & Clear */}
        {(search || dateFilter) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Active filters:</span>
            {search && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                Search: {search}
                <button onClick={() => setSearch("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFilter && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                Last order: {dateFilter}
                <button onClick={() => setDateFilter("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No customers found
            </h3>
            <p className="text-gray-500">
              {search || dateFilter
                ? "Try adjusting your filters."
                : "Start by adding customers or wait for orders to create customer records."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onViewHistory={() => openHistory(customer)}
            />
          ))}
        </div>
      )}

      {/* Customer History Modal */}
      {historyModalOpen && selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeHistory}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Order History - {selectedCustomer.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintHistory}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  title="Print history"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={closeHistory}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {modalLoading ? (
              <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div id="customer-history-print" className="p-6 space-y-6">
                {/* Customer Summary */}
                <div className="bg-gray-200 p-4 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <p className="font-medium text-gray-700">
                      {selectedCustomer.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <User className="w-3 h-3" /> Name
                    </p>
                    <p className="font-medium text-gray-700">
                      {selectedCustomer.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-700">Total Orders</p>
                    <p className="font-medium text-gray-700">
                      {analytics.totalOrders}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">Total Spent</p>
                    <p className="font-medium text-gray-700">
                      {analytics.totalSpent?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </p>
                    <p className="font-medium text-gray-700 truncate">
                      {selectedCustomer.email?.toLowerCase() ||
                        "dummy@gmail.com"}
                    </p>
                  </div>
                </div>

                {/* Order Date Filter within Modal */}
                {/* <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Order History</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="text-sm border text-gray-700 border-gray-400 rounded-lg px-2 py-1"
                    />
                    {orderDateFilter && (
                      <button
                        onClick={() => setOrderDateFilter("")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div> */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Order History</h4>

                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-1 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />

                    <DatePicker
                      selected={dateFilter ? new Date(dateFilter) : null}
                      onChange={(date: Date | null) =>
                        setDateFilter(date ? formatLocalDate(date) : "")
                      }
                      placeholderText="Select date"
                      className="text-sm outline-none bg-transparent text-gray-800"
                      dateFormat="yyyy-MM-dd"
                    />

                    {dateFilter && (
                      <button
                        onClick={() => setOrderDateFilter("")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    {orders.length === 0
                      ? "No orders found for this customer."
                      : "No orders match the selected date."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t p-6 flex justify-end">
              <button
                onClick={closeHistory}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Stat Card Component ====================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${color} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// ==================== Customer Card Component ====================
function CustomerCard({
  customer,
  onViewHistory,
}: {
  customer: Customer;
  onViewHistory: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 border border-gray-100 group">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {customer.name}
        </h3>
        <button
          onClick={onViewHistory}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="View Order History"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{customer.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {customer.email || "dummy@gmail.com"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            Last order:{" "}
            {customer.lastOrder
              ? new Date(customer.lastOrder).toLocaleDateString()
              : "Never"}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t flex justify-between text-sm">
        <div>
          <span className="text-gray-500">Orders: </span>
          <span className="font-semibold text-gray-800">
            {customer.totalOrders || 0}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Spent: </span>
          <span className="font-semibold text-gray-800">
            ₹{customer.totalSpent?.toFixed(2) || "0.00"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== Order Card Component (in modal) ====================
function OrderCard({ order }: { order: Order }) {
  const statusColors: Record<string, string> = {
    pending:
      "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
    preparing: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10",
    ready:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    served: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10",
    completed: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10",
    cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div>
          <span className="font-mono text-sm font-semibold text-gray-800">
            #{order._id.slice(-8)}
          </span>
          <span className="text-sm text-gray-500 ml-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[order.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status}
        </span>
      </div>
      <table className="w-full text-sm mb-3">
        <thead className="bg-gray-200 text-gray-600">
          <tr>
            <th className="px-2 py-1 text-left">Item</th>
            <th className="px-2 py-1 text-center">Qty</th>
            <th className="px-2 py-1 text-right">Price</th>
            <th className="px-2 py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="px-2 py-1 text-gray-700">{item.name}</td>
              <td className="px-2 py-1 text-center text-gray-700">
                {item.quantity}
              </td>
              <td className="px-2 py-1 text-right text-gray-700">
                ₹{item.price.toFixed(2)}
              </td>
              <td className="px-2 py-1 text-right text-gray-700">
                ₹{(item.quantity * item.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end text-sm border-t pt-2">
        <span className="font-semibold text-gray-700">
          Total: ₹{order.totalAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ==================== Loading Skeleton ====================
function CustomersSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between mb-3">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-6 w-6 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
