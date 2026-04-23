"use client";

import { CreditCard, Users, Calendar, DollarSign } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "$29/mo",
    restaurants: 48,
    features: ["Up to 500 orders", "Basic analytics"],
    color: "slate",
  },
  {
    name: "Pro Monthly",
    price: "$79/mo",
    restaurants: 112,
    features: ["Up to 2000 orders", "Advanced analytics", "Priority support"],
    color: "indigo",
  },
  {
    name: "Pro Annual",
    price: "$790/yr",
    restaurants: 63,
    features: ["Unlimited orders", "API access", "Dedicated manager"],
    color: "emerald",
  },
  {
    name: "Enterprise",
    price: "Custom",
    restaurants: 25,
    features: ["White-label", "SLA", "Custom integrations"],
    color: "amber",
  },
];

const recentSubscriptions = [
  {
    restaurant: "Pizza Paradise",
    plan: "Pro Annual",
    start: "2024-02-01",
    end: "2025-02-01",
    amount: "$790",
    status: "active",
  },
  {
    restaurant: "Sushi Master",
    plan: "Enterprise",
    start: "2023-11-20",
    end: "2024-11-20",
    amount: "Custom",
    status: "active",
  },
  {
    restaurant: "Burger House",
    plan: "Basic",
    start: "2024-02-10",
    end: "2024-03-10",
    amount: "$29",
    status: "trial",
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Subscription Plans
        </h1>
        <p className="text-slate-500">Manage plans and active subscriptions</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition"
          >
            <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {plan.price}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {plan.restaurants} restaurants
            </div>
            <ul className="mt-4 space-y-1 text-sm text-slate-600">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  • {f}
                </li>
              ))}
            </ul>
            <button className="mt-5 w-full py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition text-sm font-medium">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Recent Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Active Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left">Restaurant</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Start Date</th>
                <th className="px-5 py-3 text-left">End Date</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSubscriptions.map((sub, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{sub.restaurant}</td>
                  <td className="px-5 py-3">{sub.plan}</td>
                  <td className="px-5 py-3">{sub.start}</td>
                  <td className="px-5 py-3">{sub.end}</td>
                  <td className="px-5 py-3">{sub.amount}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 p-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h3 className="font-semibold text-indigo-800">
            Assign Subscription to Restaurant
          </h3>
          <p className="text-sm text-indigo-600">
            Manage plans for new partners
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm shadow-sm hover:bg-indigo-700">
          + Assign Plan
        </button>
      </div>
    </div>
  );
}
