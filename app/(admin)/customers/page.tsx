"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Phone,
  Eye,
  X,
  Mail,
  RefreshCw,
  User,
  ShoppingBag,
  Clock,
  Printer,
  IndianRupee,
  Calendar,
  Download,
  Users,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import toast from "react-hot-toast";
import { debounce } from "lodash";
import { useAuthStore } from "@/store/useAuthStore";
import * as XLSX from "xlsx";
import { useCustomers, useCustomerHistory, type Customer, type Order } from "@/hooks/useCustomers";

// ==================== Main Component ====================
export default function CustomersPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?._id;

  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [mainDateFilter, setMainDateFilter] = useState("");
  const [modalDateFilter, setModalDateFilter] = useState("");

  // Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerType, setCustomerType] = useState("all");
  const [ordersFilter, setOrdersFilter] = useState("all");
  const [spentFilter, setSpentFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");

  const {
    data: customers = [],
    isLoading,
    isFetching,
    refetch,
  } = useCustomers(restaurantId);

  const {
    data: historyData,
    isLoading: modalLoading,
  } = useCustomerHistory(historyModalOpen ? selectedCustomerId : null);

  const selectedCustomer = historyData?.customer ?? null;
  const orders: Order[] = historyData?.history ?? [];
  const analytics = historyData?.analytics ?? null;

  // Debounced search handler
  const debouncedSearch = useMemo(() => {
    return debounce((value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2 && trimmed.length !== 0) return;
      setSearch((prev) => (prev === trimmed ? prev : trimmed));
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Client-side filtering over the cached customer list
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(search) ||
          c.email?.toLowerCase().includes(q),
      );
    }

    if (fromDate) {
      filtered = filtered.filter((c) => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) >= new Date(fromDate);
      });
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) <= end;
      });
    }

    if (customerType === "new") {
      filtered = filtered.filter((c) => c.totalOrders === 1);
    }
    if (customerType === "regular") {
      filtered = filtered.filter((c) => c.totalOrders > 1);
    }

    switch (ordersFilter) {
      case "1":
        filtered = filtered.filter((c) => c.totalOrders === 1);
        break;
      case "2-5":
        filtered = filtered.filter((c) => c.totalOrders >= 2 && c.totalOrders <= 5);
        break;
      case "5-10":
        filtered = filtered.filter((c) => c.totalOrders >= 5 && c.totalOrders <= 10);
        break;
      case "10+":
        filtered = filtered.filter((c) => c.totalOrders > 10);
        break;
    }

    switch (spentFilter) {
      case "0-500":
        filtered = filtered.filter((c) => c.totalSpent >= 0 && c.totalSpent <= 500);
        break;
      case "500-2000":
        filtered = filtered.filter((c) => c.totalSpent >= 500 && c.totalSpent <= 2000);
        break;
      case "2000+":
        filtered = filtered.filter((c) => c.totalSpent > 2000);
        break;
    }

    if (emailFilter === "has") {
      filtered = filtered.filter((c) => c.email && c.email.trim() !== "");
    }
    if (emailFilter === "no") {
      filtered = filtered.filter((c) => !c.email || c.email.trim() === "");
    }

    return filtered;
  }, [customers, search, fromDate, toDate, customerType, ordersFilter, spentFilter, emailFilter]);

  const openHistory = (customer: Customer) => {
    setSelectedCustomerId(customer._id);
    setModalDateFilter("");
    setHistoryModalOpen(true);
  };

  const closeHistory = () => {
    setHistoryModalOpen(false);
    setSelectedCustomerId(null);
  };

  const filteredOrders = useMemo(() => {
    if (!modalDateFilter) return orders;
    return orders.filter((order) => formatLocalDate(new Date(order.createdAt)) === modalDateFilter);
  }, [orders, modalDateFilter]);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgOrders =
      total > 0 ? customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / total : 0;
    return { total, totalSpent, avgOrders };
  }, [customers]);

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

  const handleExport = useCallback(() => {
    setExporting(true);
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
        "Last Visit": c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "Never",
        "Customer Since": c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "-",
        "Email Available": c.email ? "Yes" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `${restaurant?.name ?? "Restaurant"}_Customers_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      link.href = url;
      link.download = fileName.length > 0 ? fileName : "customers.xlsx";

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

  if (isLoading) {
    return <CustomersSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6  mx-auto">

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">
                    Customer Management
                  </h1>

                  <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                    View and manage your customer base
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={exporting || filteredCustomers.length === 0}
                    className="flex h-9 items-center gap-2 rounded-lg bg-green-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {exporting ? "Exporting..." : "Export Data"}
                    </span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={isFetching}
                    title="Refresh"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-gray-600 ${isFetching ? "animate-spin" : ""
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-4 grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Total Customers"
          value={customerStats.total}
          icon={User}
          color="bg-blue-500 text-blue-600 border-blue-100"
        />

        <StatCard
          label="Total Revenue"
          value={`₹${customerStats.totalSpent.toFixed(2)}`}
          icon={IndianRupee}
          color="bg-emerald-500 text-emerald-600 border-emerald-100"
        />

        <StatCard
          label="Avg. Orders/Customer"
          value={customerStats.avgOrders.toFixed(1)}
          icon={ShoppingBag}
          color="bg-violet-500 text-violet-600 border-violet-100"
        />
      </div>

      {/* ================= Filters ================= */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        {/* Top Row */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          {/* Search */}
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer..."
              value={inputValue}
              onChange={handleSearchChange}
              className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-xs sm:text-sm text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2 lg:col-span-4">
            <DatePicker
              selected={fromDate ? new Date(fromDate) : null}
              onChange={(date: any) =>
                setFromDate(date ? formatLocalDate(date) : "")
              }
              placeholderText="From"
              dateFormat="yyyy-MM-dd"
              className="h-9 w-full rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
            />

            <DatePicker
              selected={toDate ? new Date(toDate) : null}
              onChange={(date: any) =>
                setToDate(date ? formatLocalDate(date) : "")
              }
              placeholderText="To"
              dateFormat="yyyy-MM-dd"
              className="h-9 w-full rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
            />
          </div>

          {/* Clear */}
          <button
            onClick={clearFilters}
            className="h-9 rounded-lg border border-red-200 px-3 text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-50 lg:col-span-3"
          >
            Clear Filters
          </button>
        </div>
        {/* Filter Dropdowns */}
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
          >
            <option value="all">Customer Type</option>
            <option value="new">New</option>
            <option value="regular">Regular</option>
          </select>

          <select
            value={ordersFilter}
            onChange={(e) => setOrdersFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
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
            className="h-9 rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
          >
            <option value="all">Spent</option>
            <option value="0-500">₹0 - ₹500</option>
            <option value="500-2000">₹500 - ₹2K</option>
            <option value="2000+">₹2K+</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm text-gray-700"
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
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
              <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                Active:
              </span>

              {search && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] sm:text-xs text-blue-700">
                  🔍 {search}
                </span>
              )}

              {fromDate && (
                <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] sm:text-xs text-green-700">
                  📅 {fromDate}
                </span>
              )}

              {toDate && (
                <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] sm:text-xs text-green-700">
                  📅 {toDate}
                </span>
              )}

              {customerType !== "all" && (
                <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] sm:text-xs text-violet-700">
                  {customerType}
                </span>
              )}

              {ordersFilter !== "all" && (
                <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] sm:text-xs text-orange-700">
                  {ordersFilter} Orders
                </span>
              )}

              {spentFilter !== "all" && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] sm:text-xs text-emerald-700">
                  {spentFilter}
                </span>
              )}

              {emailFilter !== "all" && (
                <span className="rounded-full bg-pink-50 px-2 py-1 text-[10px] sm:text-xs text-pink-700">
                  {emailFilter === "has" ? "Has Email" : "No Email"}
                </span>
              )}
            </div>
          )}
      </div>
      {/* Customers Grid */}
      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-10 sm:py-14 text-center shadow-sm">
          <div className="mx-auto max-w-md px-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <User className="h-7 w-7 text-gray-400" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              No customers found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {search ||
                fromDate ||
                toDate ||
                customerType !== "all" ||
                ordersFilter !== "all" ||
                spentFilter !== "all" ||
                emailFilter !== "all"
                ? "Try adjusting your filters."
                : "Customers will appear here after they place their first order."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onViewHistory={() => openHistory(customer)}
            />
          ))}
        </div>
      )}

      {
        historyModalOpen && selectedCustomer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2"
            onClick={closeHistory}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-[10px] text-gray-500">Customer Order History</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrintHistory}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={closeHistory}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {modalLoading ? (
                <div className="flex justify-center p-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div
                  id="customer-history-print"
                  className="flex-1 overflow-y-auto p-3 space-y-3"
                >
                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <p className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </p>
                      <p className="font-medium text-gray-800 truncate">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> Name
                      </p>
                      <p className="font-medium text-gray-800 truncate">
                        {selectedCustomer.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Total Orders</p>
                      <p className="font-medium text-gray-800">
                        {analytics?.totalOrders ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Total Spent</p>
                      <p className="font-medium text-gray-800">
                        ₹{(analytics?.totalSpent ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="font-medium text-gray-800 truncate">
                        {selectedCustomer.email?.toLowerCase() || "dummy@gmail.com"}
                      </p>
                    </div>
                  </div>

                  {/* Date filter */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-700">Order History</h4>
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-0.5 shadow-sm">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <DatePicker
                        selected={mainDateFilter ? new Date(mainDateFilter) : null}
                        onChange={(date: any) =>
                          setMainDateFilter(date ? formatLocalDate(date) : "")
                        }
                        placeholderText="Select date"
                        className="text-xs outline-none bg-transparent text-gray-800 w-24 sm:w-auto"
                        dateFormat="yyyy-MM-dd"
                      />
                      {mainDateFilter && (
                        <button
                          onClick={() => setMainDateFilter("")}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Orders list */}
                  {filteredOrders.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-lg">
                      {orders.length === 0
                        ? "No orders found for this customer."
                        : "No orders match the selected date."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredOrders.map((order) => (
                        <OrderCard key={order._id} order={order} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 px-3 py-2 flex justify-end">
                <button
                  onClick={closeHistory}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition"
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
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 sm:p-3 lg:p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] sm:text-xs font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-0.5 text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>

        <div
          className={`ml-2 flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ==================== Customer Card Component ====================
// ==================== Customer Card ====================
function CustomerCard({
  customer,
  onViewHistory,
}: {
  customer: Customer;
  onViewHistory: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base sm:text-lg font-semibold text-gray-900">
            {customer.name}
          </h3>

          <div className="mt-1">
            {customer.isRegular ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-700">
                ⭐ Regular
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-blue-700">
                🆕 New
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onViewHistory}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
          title="View History"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Contact */}
      <div className="mt-3 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{customer.phone}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="truncate">
            {customer.email || "No Email"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>
            {customer.lastVisit
              ? new Date(customer.lastVisit).toLocaleDateString()
              : "Never"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 divide-x border-t border-gray-100 pt-3">
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-indigo-600">
            {customer.totalOrders}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Orders
          </p>
        </div>

        <div className="text-center">
          <p className="truncate px-1 text-lg sm:text-xl font-bold text-emerald-600">
            ₹{customer.totalSpent.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Spent
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-amber-600">
            {customer.orders?.length ?? 0}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500">
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
    pending: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20",
    preparing: "bg-blue-50 text-blue-700 ring-1 ring-blue-700/10",
    ready: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    served: "bg-purple-50 text-purple-700 ring-1 ring-purple-700/10",
    completed: "bg-gray-50 text-gray-600 ring-1 ring-gray-500/10",
    cancelled: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">

        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">
              {order.orderNumber}
            </span>

            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[order.status]
                }`}
            >
              {order.status}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>


        {order.tableNumber && (
          <div className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
            Table {order.tableNumber}
          </div>
        )}

      </div>


      {/* Items */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">

          <thead>
            <tr className="border-b bg-gray-50 text-gray-500">
              <th className="px-2 py-2 text-left">
                Item
              </th>
              <th className="px-2 py-2 text-center">
                Qty
              </th>
              <th className="px-2 py-2 text-right">
                Price
              </th>
              <th className="px-2 py-2 text-right">
                Total
              </th>
            </tr>
          </thead>


          <tbody>
            {order.items.map((item) => (
              <tr
                key={item._id}
                className="border-b last:border-0"
              >

                <td className="px-2 py-2 text-gray-700">
                  <div className="font-medium">
                    {item.name}
                  </div>

                  {item.addons.length > 0 && (
                    <div className="text-[11px] text-gray-500">
                      + {item.addons.join(", ")}
                    </div>
                  )}
                </td>


                <td className="px-2 py-2 text-center text-gray-700">
                  {item.quantity}
                </td>


                <td className="px-2 py-2 text-right text-gray-700">
                  ₹{item.price.toFixed(2)}
                </td>


                <td className="px-2 py-2 text-right font-medium text-gray-800">
                  ₹{item.total.toFixed(2)}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>


      {/* Bill Summary */}
      <div className="mt-3 border-t pt-3 space-y-1 text-sm">

        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>
            ₹{order.totalAmount.toFixed(2)}
          </span>
        </div>


        <div className="flex justify-between text-gray-600">
          <span>CGST</span>
          <span>
            ₹{order.cgstAmount.toFixed(2)}
          </span>
        </div>


        <div className="flex justify-between text-gray-600">
          <span>SGST</span>
          <span>
            ₹{order.sgstAmount.toFixed(2)}
          </span>
        </div>


        <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
          <span>Grand Total</span>
          <span className="text-green-600">
            ₹{order.finalAmount.toFixed(2)}
          </span>
        </div>

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