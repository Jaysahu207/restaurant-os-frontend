"use client";

import {
    Download,
    ExternalLink,
    Save,
    Pencil,
    Copy,
} from "lucide-react";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import {
    getGoogleReviewLink,
    saveGoogleReviewLink,
} from "@/services/reviewService";

import { toast } from "react-hot-toast";

interface Props {
    restaurantId: string;
    existingLink?: string;
}

export const GoogleReviewSection = ({
    restaurantId,
    existingLink = "",
}: Props) => {

    const [googleReviewLink, setGoogleReviewLink] =
        useState(existingLink || "");

    const [loading, setLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(
        existingLink ? false : true
    );

    // =========================================
    // FETCH LINK
    // =========================================

    const fetchGoogleReviewLink = async () => {
        try {
            const link = await getGoogleReviewLink(
                restaurantId
            );

            setGoogleReviewLink(link || "");

            if (link) {
                setIsEditing(false);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchGoogleReviewLink();
    }, []);

    // =========================================
    // SAVE LINK
    // =========================================

    const handleSave = async () => {
        try {
            if (!googleReviewLink.trim()) {
                return toast.error(
                    "Please enter Google review link"
                );
            }

            if (
                !googleReviewLink.includes("google.com") &&
                !googleReviewLink.includes("g.page")
            ) {
                return toast.error(
                    "Enter valid Google review link"
                );
            }

            setLoading(true);

            await saveGoogleReviewLink(
                restaurantId,
                googleReviewLink
            );

            toast.success(
                "Google review link saved"
            );

            setIsEditing(false);

        } catch (error) {
            console.log(error);

            toast.error(
                "Failed to save review link"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // DOWNLOAD QR
    // =========================================

    const downloadQRCode = () => {

        const svg =
            document.getElementById("reviewQRCode");

        if (!svg) return;

        const svgData =
            new XMLSerializer().serializeToString(svg);

        const canvas =
            document.createElement("canvas");

        const ctx =
            canvas.getContext("2d");

        const img = new Image();

        img.onload = () => {

            // HIGH QUALITY SIZE

            const canvasSize = 1200;

            canvas.width = canvasSize;
            canvas.height = canvasSize;

            if (!ctx) return;

            // WHITE BACKGROUND

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // PADDING

            const padding = 140;

            // ROUNDED CARD BACKGROUND

            const radius = 40;

            ctx.fillStyle = "#ffffff";

            roundRect(
                ctx,
                padding / 2,
                padding / 2,
                canvasSize - padding,
                canvasSize - padding,
                radius
            );

            ctx.fill();

            // DRAW QR INSIDE WITH PADDING

            // ========================================
            // ROUNDED CLIPPING
            // ========================================

            const qrX = padding;
            const qrY = padding;
            const qrSize = canvasSize - padding * 2;
            const qrRadius = 60;

            ctx.save();

            ctx.beginPath();

            ctx.moveTo(qrX + qrRadius, qrY);

            ctx.lineTo(qrX + qrSize - qrRadius, qrY);

            ctx.quadraticCurveTo(
                qrX + qrSize,
                qrY,
                qrX + qrSize,
                qrY + qrRadius
            );

            ctx.lineTo(
                qrX + qrSize,
                qrY + qrSize - qrRadius
            );

            ctx.quadraticCurveTo(
                qrX + qrSize,
                qrY + qrSize,
                qrX + qrSize - qrRadius,
                qrY + qrSize
            );

            ctx.lineTo(qrX + qrRadius, qrY + qrSize);

            ctx.quadraticCurveTo(
                qrX,
                qrY + qrSize,
                qrX,
                qrY + qrSize - qrRadius
            );

            ctx.lineTo(qrX, qrY + qrRadius);

            ctx.quadraticCurveTo(
                qrX,
                qrY,
                qrX + qrRadius,
                qrY
            );

            ctx.closePath();

            ctx.clip();

            // DRAW QR

            ctx.drawImage(
                img,
                qrX,
                qrY,
                qrSize,
                qrSize
            );

            ctx.restore();
            // EXPORT

            const pngFile =
                canvas.toDataURL("image/png");

            const downloadLink =
                document.createElement("a");

            downloadLink.download =
                "google-review-qr.png";

            downloadLink.href = pngFile;

            downloadLink.click();
        };

        img.src =
            "data:image/svg+xml;base64," +
            btoa(
                unescape(
                    encodeURIComponent(svgData)
                )
            );
    };

    // ========================================
    // ROUND RECT HELPER
    // ========================================

    const roundRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ) => {

        ctx.beginPath();

        ctx.moveTo(x + radius, y);

        ctx.lineTo(x + width - radius, y);

        ctx.quadraticCurveTo(
            x + width,
            y,
            x + width,
            y + radius
        );

        ctx.lineTo(
            x + width,
            y + height - radius
        );

        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
        );

        ctx.lineTo(x + radius, y + height);

        ctx.quadraticCurveTo(
            x,
            y + height,
            x,
            y + height - radius
        );

        ctx.lineTo(x, y + radius);

        ctx.quadraticCurveTo(
            x,
            y,
            x + radius,
            y
        );

        ctx.closePath();
    };

    // =========================================
    // COPY LINK
    // =========================================
    const copyLink = async () => {
        try {

            if (navigator.clipboard) {

                await navigator.clipboard.writeText(
                    googleReviewLink
                );

            } else {

                // Fallback Method

                const textArea =
                    document.createElement("textarea");

                textArea.value = googleReviewLink;

                document.body.appendChild(textArea);

                textArea.select();

                document.execCommand("copy");

                document.body.removeChild(textArea);
            }

            toast.success("Link copied");

        } catch (error) {

            console.log(error);

            toast.error("Failed to copy link");
        }
    };
    return (
        <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-100">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-6">

                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Google Review QR
                    </h2>

                    <p className="text-gray-500 mt-1 text-sm">
                        Generate QR code for customer reviews
                    </p>
                </div>

                {!isEditing && googleReviewLink && (
                    <button
                        onClick={() =>
                            setIsEditing(true)
                        }
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-2xl hover:bg-gray-100"
                    >
                        <Pencil size={16} />
                        Edit
                    </button>
                )}
            </div>

            {/* INPUT */}

            <div className="space-y-4">

                <input
                    type="url"
                    placeholder="Paste Google Review Link"
                    value={googleReviewLink || ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                        setGoogleReviewLink(
                            e.target.value
                        )
                    }
                    className={`w-full border p-4 rounded-2xl outline-none transition-all
                        
                        ${isEditing
                            ? "border-green-500"
                            : "border-gray-200 bg-gray-100 cursor-not-allowed"
                        }
                    `}
                />

                {isEditing && (
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl transition-all duration-200"
                    >
                        <Save size={18} />

                        {loading
                            ? "Saving..."
                            : "Save Review Link"}
                    </button>
                )}
            </div>

            {/* QR SECTION */}

            {googleReviewLink && (
                <div className="mt-10 flex flex-col items-center">

                    <div className="bg-white p-4 rounded-3xl shadow-lg border">
                        <QRCode
                            id="reviewQRCode"
                            value={googleReviewLink}
                            size={220}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="H"
                        />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-gray-800">
                        Scan To Review Us ⭐
                    </h3>

                    <p className="text-sm text-gray-500 text-center mt-2 max-w-sm">
                        Customers can scan this QR code to directly open your Google review page.
                    </p>

                    {/* ACTIONS */}

                    <div className="flex gap-4 mt-6 flex-wrap justify-center">

                        <button
                            onClick={downloadQRCode}
                            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-2xl hover:opacity-90"
                        >
                            <Download size={18} />
                            Download QR
                        </button>

                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 border border-gray-300 px-5 py-3 rounded-2xl hover:bg-gray-100"
                        >
                            <Copy size={18} />
                            Copy Link
                        </button>

                        <a
                            href={googleReviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 border border-gray-300 px-5 py-3 rounded-2xl hover:bg-gray-100"
                        >
                            <ExternalLink size={18} />
                            Open Review Page
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};