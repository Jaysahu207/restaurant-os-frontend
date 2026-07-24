// components/InventorySkeleton.tsx
export default function InventorySkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-6 mx-auto animate-pulse">
            {/* Low Stock Alert Placeholder */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-300 rounded"></div>
                    <div className="h-5 w-40 bg-yellow-300 rounded"></div>
                </div>
                <div className="h-4 w-64 bg-yellow-200 rounded mt-1"></div>
            </div>

            {/* Page Title & Description */}
            <div>
                <div className="h-9 w-64 bg-gray-200 rounded"></div>
                <div className="h-5 w-80 bg-gray-200 rounded mt-1"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-7 w-16 bg-gray-200 rounded mt-1"></div>
                            </div>
                            <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="flex gap-2">
                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="sm:w-48">
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Name",
                                    "Category",
                                    "Quantity",
                                    "Unit",
                                    "Reorder Level",
                                    "Cost/Unit",
                                    "Total Value",
                                    "Supplier",
                                    "Actions",
                                ].map((_, idx) => (
                                    <th key={idx} className="px-4 py-3 text-left">
                                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[...Array(10)].map((_, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50">
                                    {[...Array(9)].map((_, colIdx) => (
                                        <td key={colIdx} className="px-4 py-3">
                                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                </div>
            </div>
        </div>
    );
}