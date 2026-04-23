"use client";

import { useState } from "react";
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    Calendar,
    ChevronDown,
    Download,
    Filter,
} from "lucide-react";

// Mock data – replace with API calls
const mockRevenueData = {
    daily: [1200, 1350, 1100, 1450, 1600, 1900, 2100],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const mockOrdersByStatus = {
    labels: ["Completed", "Preparing", "Pending", "Cancelled"],
    data: [145, 32, 18, 7],
    colors: ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-red-500"],
};

const mockPopularItems = [
    { name: "Margherita Pizza", quantity: 128, revenue: 1662.72 },
    { name: "Chicken Burger", quantity: 97, revenue: 1066.03 },
    { name: "Caesar Salad", quantity: 85, revenue: 764.15 },
    { name: "Grilled Salmon", quantity: 62, revenue: 1177.38 },
    { name: "Mango Smoothie", quantity: 54, revenue: 323.46 },
];

const mockCategoryRevenue = [
    { category: "Main Course", revenue: 4850 },
    { category: "Starters", revenue: 2100 },
    { category: "Drinks", revenue: 950 },
    { category: "Desserts", revenue: 720 },
];

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState("week"); // today, week, month, custom
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Summary stats (would be calculated based on selected date range)
    const summary = {
        totalRevenue: 12580.5,
        totalOrders: 342,
        avgOrderValue: 36.78,
        topSellingItem: "Margherita Pizza",
    };

    return (
        <div className="space-y-6">
            {/* Header with date range */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                <div className="flex items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                        >
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                                {dateRange === "today" && "Today"}
                                {dateRange === "week" && "This Week"}
                                {dateRange === "month" && "This Month"}
                                {dateRange === "custom" && "Custom Range"}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                        {showDatePicker && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                                <button
                                    onClick={() => {
                                        setDateRange("today");
                                        setShowDatePicker(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => {
                                        setDateRange("week");
                                        setShowDatePicker(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={() => {
                                        setDateRange("month");
                                        setShowDatePicker(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => {
                                        setDateRange("custom");
                                        setShowDatePicker(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Custom Range
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Export Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={`$${summary.totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="bg-green-500"
                    trend="+12.5%"
                />
                <StatCard
                    label="Total Orders"
                    value={summary.totalOrders}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    trend="+8.2%"
                />
                <StatCard
                    label="Avg. Order Value"
                    value={`$${summary.avgOrderValue.toFixed(2)}`}
                    icon={TrendingUp}
                    color="bg-purple-500"
                    trend="+3.1%"
                />
                <StatCard
                    label="Top Item"
                    value={summary.topSellingItem}
                    icon={Users}
                    color="bg-orange-500"
                    trend="145 sold"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {mockRevenueData.labels.map((label, i) => (
                            <div key={label} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-full bg-blue-500 rounded-t"
                                    style={{ height: `${(mockRevenueData.daily[i] / 2500) * 100}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-2">{label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                        * Replace with actual chart library (Recharts, Chart.js)
                    </p>
                </div>

                {/* Orders by Status (Pie chart placeholder) */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h3>
                    <div className="flex items-center justify-center h-64">
                        <div className="relative w-48 h-48">
                            {/* Simple pie representation using conic-gradient */}
                            <div
                                className="w-full h-full rounded-full"
                                style={{
                                    background: `conic-gradient(
                    #22c55e 0deg ${(mockOrdersByStatus.data[0] / 202) * 360}deg,
                    #3b82f6 ${(mockOrdersByStatus.data[0] / 202) * 360}deg ${((mockOrdersByStatus.data[0] + mockOrdersByStatus.data[1]) / 202) * 360
                                        }deg,
                    #eab308 ${((mockOrdersByStatus.data[0] + mockOrdersByStatus.data[1]) / 202) * 360
                                        }deg ${((mockOrdersByStatus.data[0] + mockOrdersByStatus.data[1] + mockOrdersByStatus.data[2]) /
                                            202) *
                                        360
                                        }deg,
                    #ef4444 ${((mockOrdersByStatus.data[0] + mockOrdersByStatus.data[1] + mockOrdersByStatus.data[2]) /
                                            202) *
                                        360
                                        }deg 360deg
                  )`,
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {mockOrdersByStatus.labels.map((label, i) => (
                            <div key={label} className="flex items-center gap-2 text-sm">
                                <span className={`w-3 h-3 rounded-full ${mockOrdersByStatus.colors[i]}`} />
                                <span className="text-gray-600">{label}</span>
                                <span className="font-medium ml-auto">{mockOrdersByStatus.data[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Second Row: Category Revenue and Popular Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Revenue (Bar chart) */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Category</h3>
                    <div className="space-y-3">
                        {mockCategoryRevenue.map((cat) => (
                            <div key={cat.category}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{cat.category}</span>
                                    <span className="font-medium">${cat.revenue}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(cat.revenue / 5000) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Items Table */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Items</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-2 text-left">Item</th>
                                <th className="px-3 py-2 text-right">Quantity</th>
                                <th className="px-3 py-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {mockPopularItems.map((item) => (
                                <tr key={item.name}>
                                    <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right">${item.revenue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Insights - could add customer metrics, etc. */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Insights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">New Customers</p>
                        <p className="text-2xl font-bold text-gray-800">124</p>
                        <p className="text-xs text-green-600">+18% vs last period</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Repeat Customers</p>
                        <p className="text-2xl font-bold text-gray-800">218</p>
                        <p className="text-xs text-green-600">+7% vs last period</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Avg. Items per Order</p>
                        <p className="text-2xl font-bold text-gray-800">2.4</p>
                        <p className="text-xs text-yellow-600">+0.2 vs last period</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component (reused with trend)
function StatCard({ label, value, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    {trend && (
                        <p className="text-xs text-green-600 mt-2">{trend} ↑</p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}