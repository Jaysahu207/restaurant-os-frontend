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
  IndianRupee,
  Calendar,
  Download,
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
import * as XLSX from "xlsx";
// ==================== Types ====================
interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit?: string;
  totalOrders: number;
  totalSpent: number;
  isRegular: boolean;
  orders: string[];
  createdAt: string;
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

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mainDateFilter, setMainDateFilter] = useState(""); // for main customer list
  const [modalDateFilter, setModalDateFilter] = useState(""); // for order history inside modal
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [orderDateFilter, setOrderDateFilter] = useState(""); // For filtering orders within modal
  const [modalLoading, setModalLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // new state
  const { restaurant } = useAuthStore();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerType, setCustomerType] = useState("all");
  const [ordersFilter, setOrdersFilter] = useState("all");
  const [spentFilter, setSpentFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");

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

    // Search
    if (search) {
      const q = search.toLowerCase();

      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(search) ||
          c.email?.toLowerCase().includes(q),
      );
    }

    // From Date
    if (fromDate) {
      filtered = filtered.filter((c) => {
        if (!c.lastVisit) return false;

        return new Date(c.lastVisit) >= new Date(fromDate);
      });
    }

    // To Date
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((c) => {
        if (!c.lastVisit) return false;

        return new Date(c.lastVisit) <= end;
      });
    }

    // Customer Type
    if (customerType === "new") {
      filtered = filtered.filter((c) => c.totalOrders === 1);
    }

    if (customerType === "regular") {
      filtered = filtered.filter((c) => c.totalOrders > 1);
    }

    // Orders Filter
    switch (ordersFilter) {
      case "1":
        filtered = filtered.filter((c) => c.totalOrders === 1);
        break;

      case "2-5":
        filtered = filtered.filter(
          (c) => c.totalOrders >= 2 && c.totalOrders <= 5,
        );
        break;

      case "5-10":
        filtered = filtered.filter(
          (c) => c.totalOrders >= 5 && c.totalOrders <= 10,
        );
        break;

      case "10+":
        filtered = filtered.filter((c) => c.totalOrders > 10);
        break;
    }

    // Spent Filter
    switch (spentFilter) {
      case "0-500":
        filtered = filtered.filter(
          (c) => c.totalSpent >= 0 && c.totalSpent <= 500,
        );
        break;

      case "500-2000":
        filtered = filtered.filter(
          (c) => c.totalSpent >= 500 && c.totalSpent <= 2000,
        );
        break;

      case "2000+":
        filtered = filtered.filter((c) => c.totalSpent > 2000);
        break;
    }

    // Email Filter
    if (emailFilter === "has") {
      filtered = filtered.filter((c) => c.email && c.email.trim() !== "");
    }

    if (emailFilter === "no") {
      filtered = filtered.filter((c) => !c.email || c.email.trim() === "");
    }

    setFilteredCustomers(filtered);
  }, [
    customers,
    search,
    fromDate,
    toDate,
    customerType,
    ordersFilter,
    spentFilter,
    emailFilter,
  ]);
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
      // console.log("backend data", historyData);
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
    if (!modalDateFilter) return orders;
    return orders.filter((order) => {
      return formatLocalDate(new Date(order.createdAt)) === modalDateFilter;
    });
  }, [orders, modalDateFilter]);

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
    setInputValue("");

    setFromDate("");
    setToDate("");

    setCustomerType("all");
    setOrdersFilter("all");
    setSpentFilter("all");
    setEmailFilter("all");

    debouncedSearch("");
  };

  // console.log("Filtered Customers -> ", filteredCustomers);
  // console.log("Customer Data -> ", selectedCustomer, orders);
  // ==================== EXPORT HANDLER ====================
  const handleExport = useCallback(() => {
    setExporting(true);
    // 1. Get the currently displayed customers (filtered by search & date)
    try {
      const baseData = filteredCustomers;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const activeCustomers = baseData.filter((c) => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) >= sixMonthsAgo;
      });
      if (activeCustomers.length === 0) {
        toast.error("No customers with orders in the last 6 months.");
        return;
      }

      const rows = activeCustomers.map((c) => ({
        Name: c.name,
        Phone: c.phone,
        Email: c.email || "",

        "Customer Type": c.isRegular ? "Regular" : "New",

        "Total Orders": c.totalOrders ?? 0,

        "Total Visits": c.orders?.length ?? 0,

        "Total Spent (₹)": (c.totalSpent ?? 0).toFixed(2),

        "Average Order Value (₹)":
          c.totalOrders && c.totalOrders > 0
            ? ((c.totalSpent ?? 0) / c.totalOrders).toFixed(2)
            : "0.00",

        "Last Visit": c.lastVisit
          ? new Date(c.lastVisit).toLocaleDateString("en-IN")
          : "Never",

        "Customer Since": c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("en-IN")
          : "-",

        "Email Available": c.email ? "Yes" : "No",
      }));
      // 4. Create workbook & sheet
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      // 5. Generate Excel file and download
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `${restaurant?.name ?? "Restaurant"}_Customers_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      link.href = url;
      link.download = 0 < fileName.length ? fileName : "customers.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(`Exported ${activeCustomers.length} customers.`);
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [filteredCustomers, restaurant?.name]);
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
    <div className="space-y-6 p-4 md:p-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Customer Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your customer base
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || filteredCustomers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export Data"}
          </button>
          {/* Refresh Button */}
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
          icon={IndianRupee}
          color="bg-green-500"
        />
        <StatCard
          label="Avg. Orders/Customer"
          value={customerStats.avgOrders.toFixed(1)}
          icon={ShoppingBag}
          color="bg-purple-500"
        />
      </div>

      {/* ================= Filters ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">

        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

          {/* Search */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer..."
              value={inputValue}
              onChange={handleSearchChange}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* From Date */}
          <DatePicker
            selected={fromDate ? new Date(fromDate) : null}
            onChange={(date: any) =>
              setFromDate(date ? formatLocalDate(date) : "")
            }
            placeholderText="From"
            dateFormat="yyyy-MM-dd"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-700"
          />

          {/* To Date */}
          <DatePicker
            selected={toDate ? new Date(toDate) : null}
            onChange={(date: any) =>
              setToDate(date ? formatLocalDate(date) : "")
            }
            placeholderText="To"
            dateFormat="yyyy-MM-dd"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-700"
          />

          {/* Clear */}
          <button
            onClick={clearFilters}
            className="h-10 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition"
          >
            Clear
          </button>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700"
          >
            <option value="all">Customer Type</option>
            <option value="new">New</option>
            <option value="regular">Regular</option>
          </select>

          <select
            value={ordersFilter}
            onChange={(e) => setOrdersFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700"
          >
            <option value="all">Orders</option>
            <option value="1">1 Order</option>
            <option value="2-5">2 - 5</option>
            <option value="5-10">5 - 10</option>
            <option value="10+">10+</option>
          </select>

          <select
            value={spentFilter}
            onChange={(e) => setSpentFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700"
          >
            <option value="all">Spent</option>
            <option value="0-500">₹0 - ₹500</option>
            <option value="500-2000">₹500 - ₹2K</option>
            <option value="2000+">₹2K+</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700"
          >
            <option value="all">Email</option>
            <option value="has">Has Email</option>
            <option value="no">No Email</option>
          </select>

        </div>

        {/* Active Filters */}
        {(search ||
          fromDate ||
          toDate ||
          customerType !== "all" ||
          ordersFilter !== "all" ||
          spentFilter !== "all" ||
          emailFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">

              <span className="text-xs font-medium text-gray-500">
                Active:
              </span>

              {search && (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                  🔍 {search}
                </span>
              )}

              {fromDate && (
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                  📅 {fromDate}
                </span>
              )}

              {toDate && (
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                  📅 {toDate}
                </span>
              )}

              {customerType !== "all" && (
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                  {customerType}
                </span>
              )}

              {ordersFilter !== "all" && (
                <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">
                  {ordersFilter} Orders
                </span>
              )}

              {spentFilter !== "all" && (
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                  {spentFilter}
                </span>
              )}

              {emailFilter !== "all" && (
                <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-700 text-xs">
                  {emailFilter === "has" ? "Has Email" : "No Email"}
                </span>
              )}

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
              {search ||
                fromDate ||
                toDate ||
                customerType !== "all" ||
                ordersFilter !== "all" ||
                spentFilter !== "all" ||
                emailFilter !== "all"
                ? "Try adjusting your filters."
                : "Start by adding customers or wait for orders to create customer records."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Order History</h4>

                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-1 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />

                    <DatePicker
                      selected={
                        mainDateFilter ? new Date(mainDateFilter) : null
                      }
                      onChange={(date: any) =>
                        setMainDateFilter(date ? formatLocalDate(date) : "")
                      }
                      placeholderText="Select date"
                      className="text-sm outline-none bg-transparent text-gray-800"
                      dateFormat="yyyy-MM-dd"
                    />

                    {mainDateFilter && (
                      <button
                        onClick={() => setMainDateFilter("")}
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {customer.name}
          </h3>

          <div className="mt-1">
            {customer.isRegular ? (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-medium">
                ⭐ Regular Customer
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-medium">
                🆕 New Customer
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onViewHistory}
          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
          title="View History"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      {/* Customer Info */}
      <div className="mt-5 space-y-3 text-sm">

        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{customer.phone}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">
            {customer.email || "No Email"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {customer.lastVisit
              ? new Date(customer.lastVisit).toLocaleDateString()
              : "Never"}
          </span>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t">

        <div className="text-center">
          <p className="text-xl font-bold text-indigo-600">
            {customer.totalOrders}
          </p>
          <p className="text-xs text-gray-500">
            Orders
          </p>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-green-600">
            ₹{customer.totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            Spent
          </p>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-orange-600">
            {customer.orders?.length ?? 0}
          </p>
          <p className="text-xs text-gray-500">
            Visits
          </p>
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
          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-700"
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
