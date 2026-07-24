// components/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
    return (
        <div className="space-y-8 border border-gray-200 rounded-lg p-4 md:p-6 animate-pulse">
            {/* Header */}
            <div>
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-md">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-7 w-24 bg-gray-200 rounded"></div>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TableManagement Placeholder */}
            <div className="p-4 md:p-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-5 rounded-2xl shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 h-8 bg-gray-200 rounded-full"></div>
                                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white p-5 rounded-2xl shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full"></div>
                            </div>
                        ))}
                        <div className="pt-2 h-4 w-24 bg-gray-200 rounded ml-auto"></div>
                    </div>
                </div>
            </div>

            {/* Recent Orders & Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[...Array(7)].map((_, i) => (
                                        <th key={i} className="px-5 py-3">
                                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-5 py-3">
                                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-5 rounded-2xl shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-6 bg-gray-200 rounded"></div>
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-12 bg-gray-200 rounded mt-1"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}