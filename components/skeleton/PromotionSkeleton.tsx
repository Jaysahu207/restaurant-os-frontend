// components/PromotionSkeleton.tsx
export default function PromotionSkeleton() {
    return (
        <div className="w-full max-w-[1800px] mx-auto space-y-5 px-3 py-4 sm:px-5 sm:py-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 animate-pulse">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-8 w-56 bg-gray-200 rounded"></div>
                <div className="w-full sm:w-auto h-11 w-40 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="sm:w-40 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="sm:w-40 h-10 bg-gray-200 rounded-lg"></div>
                </div>
            </div>

            {/* Send Promotion Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border border-gray-100">
                <div className="flex items-center gap-2 border-b pb-2">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                        <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                <div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                    <div className="w-full h-20 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Customer selection */}
                <div className="border rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>

                    <div className="relative mb-3">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-9 bg-gray-200 rounded-lg"></div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2 p-2">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-48 bg-gray-200 rounded mt-1"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full h-11 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Code",
                                    "Description",
                                    "Discount",
                                    "Min Order",
                                    "Valid From",
                                    "Valid To",
                                    "Usage",
                                    "Status",
                                    "Actions",
                                ].map((_, idx) => (
                                    <th key={idx} className="px-4 py-3 text-left">
                                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[...Array(6)].map((_, rowIdx) => (
                                <tr key={rowIdx}>
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
            </div>
        </div>
    );
}