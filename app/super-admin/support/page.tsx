// app/super-admin/support/page.tsx
"use client";

import { useState } from "react";
import {
  Headphones,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Search,
  Filter,
  ChevronRight,
  Star,
  StarOff,
  Phone,
  Globe,
  User,
  Hash,
} from "lucide-react";

// Mock ticket data
const initialTickets = [
  {
    id: "#TKT-1001",
    subject: "Unable to process subscription payment",
    user: "John Doe",
    restaurant: "Pizza Paradise",
    status: "open",
    priority: "high",
    time: "2 hours ago",
    starred: false,
  },
  {
    id: "#TKT-1002",
    subject: "Restaurant dashboard not loading",
    user: "Emma Lee",
    restaurant: "Sushi Master",
    status: "in-progress",
    priority: "urgent",
    time: "5 hours ago",
    starred: true,
  },
  {
    id: "#TKT-1003",
    subject: "Need to update billing information",
    user: "Mike Ross",
    restaurant: "Burger House",
    status: "resolved",
    priority: "low",
    time: "1 day ago",
    starred: false,
  },
  {
    id: "#TKT-1004",
    subject: "Feature request: Export analytics",
    user: "Sarah Kim",
    restaurant: "Vegan Delight",
    status: "open",
    priority: "medium",
    time: "2 days ago",
    starred: false,
  },
];

const statusColors = {
  open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-blue-100 text-blue-700 border-blue-200",
};

const priorityColors = {
  urgent: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-indigo-100 text-indigo-700 border-indigo-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const supportStats = [
  {
    title: "Open Tickets",
    value: "12",
    icon: MessageCircle,
    change: "+3",
    color: "emerald",
  },
  {
    title: "Avg Response Time",
    value: "2.4h",
    icon: Clock,
    change: "-0.5h",
    color: "blue",
  },
  {
    title: "Resolution Rate",
    value: "94%",
    icon: CheckCircle,
    change: "+2%",
    color: "purple",
  },
  {
    title: "Customer Satisfaction",
    value: "4.8/5",
    icon: Headphones,
    change: "+0.2",
    color: "amber",
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const toggleStar = (id: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, starred: !ticket.starred } : ticket,
      ),
    );
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Support Center
        </h1>
        <p className="text-slate-500 mt-1">
          Manage tickets, respond to queries, and track customer satisfaction
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {supportStats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-full bg-indigo-50">
                <stat.icon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
              <span className="text-xs text-slate-500 ml-2">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Ticket List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID, user, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
                    <Filter size={18} className="text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket List */}
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => toggleStar(ticket.id)}>
                          {ticket.starred ? (
                            <Star
                              size={16}
                              className="text-amber-400 fill-amber-400"
                            />
                          ) : (
                            <StarOff size={16} className="text-slate-300" />
                          )}
                        </button>
                        <span className="text-xs font-mono text-slate-500">
                          {ticket.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            statusColors[
                              ticket.status as keyof typeof statusColors
                            ]
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            priorityColors[
                              ticket.priority as keyof typeof priorityColors
                            ]
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {ticket.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash size={12} /> {ticket.restaurant}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {ticket.time}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-slate-300 group-hover:text-indigo-500 transition"
                    />
                  </div>
                </div>
              ))}
              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No tickets found matching your criteria.
                </div>
              )}
            </div>

            {/* View All Link */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Load more tickets →
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Contact & Quick Actions */}
        <div className="space-y-6">
          {/* Live Chat Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full absolute bottom-0 right-0 ring-2 ring-white"></div>
                  <MessageCircle size={20} className="text-indigo-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Live Chat</h2>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-auto">
                  2 active
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    JD
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-2 text-sm">
                    <p className="font-medium text-slate-800">John Doe</p>
                    <p className="text-slate-600">
                      Payment not going through...
                    </p>
                    <span className="text-xs text-slate-400 mt-1 block">
                      2 min ago
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">
                    EL
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-2 text-sm">
                    <p className="font-medium text-slate-800">Emma Lee</p>
                    <p className="text-slate-600">Dashboard loading issue</p>
                    <span className="text-xs text-slate-400 mt-1 block">
                      15 min ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Type a reply..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Headphones size={18} className="text-indigo-600" />
              Contact Support
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                <div className="p-2 rounded-full bg-emerald-100">
                  <Mail size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Email Support
                  </p>
                  <p className="text-xs text-slate-500">
                    support@restaurantadmin.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                <div className="p-2 rounded-full bg-blue-100">
                  <Phone size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Phone Support
                  </p>
                  <p className="text-xs text-slate-500">+1 (800) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                <div className="p-2 rounded-full bg-purple-100">
                  <Globe size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Knowledge Base
                  </p>
                  <p className="text-xs text-slate-500">
                    help.restaurantadmin.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
            <h2 className="font-semibold text-slate-800 mb-2">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-3">
              Resolve common issues faster
            </p>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white/80 hover:bg-white transition text-sm text-slate-700">
                📝 Create Knowledge Base Article
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white/80 hover:bg-white transition text-sm text-slate-700">
                📊 Generate Support Report
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white/80 hover:bg-white transition text-sm text-slate-700">
                ⚡ Set Up Auto-Responses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
