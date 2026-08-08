// components/reports/CustomerAnalytics.tsx

import type { CustomerAnalytics as CustomerAnalyticsData } from "@/types/reports";

export function CustomerAnalytics({ customers }: { customers: CustomerAnalyticsData }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Customer Analytics</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <Stat label="New Customers" value={customers.newCustomers} />
        <Stat label="Returning" value={customers.returningCustomers} />
        <Stat label="Repeat Rate" value={`${customers.repeatRate}%`} />
        <Stat label="Avg. Spend" value={`₹${customers.avgCustomerSpend.toLocaleString("en-IN")}`} />
      </div>

      {customers.topCustomers.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No customer orders for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                <th className="text-left py-2 font-medium">Customer</th>
                <th className="text-right py-2 font-medium">Orders</th>
                <th className="text-right py-2 font-medium">Total Spent</th>
                <th className="text-right py-2 font-medium">Avg. Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.topCustomers.map((c) => (
                <tr key={c.customerId}>
                  <td className="py-2.5">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    {c.isNew && (
                      <span className="ml-2 text-[10px] font-medium text-[#F97316] bg-orange-50 px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-gray-700">{c.orders}</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-right text-gray-500">₹{c.avgOrderValue.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
