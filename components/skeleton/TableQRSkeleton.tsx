// components/TableQRSkeleton.tsx
export default function TableQRSkeleton() {
    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
            <div className="mx-auto space-y-8 animate-pulse">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="h-9 w-64 bg-gray-200 rounded-md"></div>
                        <div className="h-5 w-80 bg-gray-200 rounded-md mt-2"></div>
                    </div>
                    <div className="h-11 w-44 bg-gray-200 rounded-xl"></div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                        >
                            {/* Card Header */}
                            <div className="bg-gray-300 px-5 py-4 h-24">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-gray-400 rounded"></div>
                                            <div className="h-6 w-24 bg-gray-400 rounded"></div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                                            <div className="h-4 w-20 bg-gray-400 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-8 h-8 bg-gray-400 rounded-lg"></div>
                                        <div className="w-8 h-8 bg-gray-400 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Placeholder */}
                            <div className="p-5 flex flex-col items-center border-b border-gray-100">
                                <div className="relative">
                                    <div className="w-[170px] h-[170px] bg-gray-200 rounded-xl shadow-sm"></div>
                                </div>
                                <div className="h-3 w-24 bg-gray-200 rounded mt-3"></div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 flex justify-center gap-3">
                                <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Online Ordering QR Codes Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                    <div className="mb-6">
                        <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
                        <div className="h-4 w-96 bg-gray-200 rounded-md mt-2"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Takeaway QR */}
                        <div className="border border-gray-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div>
                                    <div className="h-5 w-28 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded mt-1"></div>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-[190px] h-[190px] bg-gray-200 rounded-xl border border-gray-100"></div>
                            </div>
                            <div className="mt-5 flex gap-3">
                                <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
                                <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
                            </div>
                        </div>

                        {/* Delivery QR */}
                        <div className="border border-gray-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div>
                                    <div className="h-5 w-28 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded mt-1"></div>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-[190px] h-[190px] bg-gray-200 rounded-xl border border-gray-100"></div>
                            </div>
                            <div className="mt-5 flex gap-3">
                                <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
                                <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}