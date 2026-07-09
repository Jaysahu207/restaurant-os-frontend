export async function generateInvoicePDF(
    element: HTMLElement,
    invoiceNo: string
) {
    if (typeof window === "undefined") return;

    const [{ default: jsPDF }, htmlToImage] = await Promise.all([
        import("jspdf"),
        import("html-to-image"),
    ]);

    const width = element.scrollWidth;
    const height = element.scrollHeight;
    // Convert HTML to PNG
    const dataUrl = await htmlToImage.toPng(element, {
        width,
        height,
        canvasWidth: width * 3,
        canvasHeight: height * 3,
        pixelRatio: 1,
        backgroundColor: "#ffffff",
    });

    // Get image dimensions
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
    });

    // Thermal receipt width (80mm)
    const pdfWidth = 80;

    const pdfHeight = (img.height * pdfWidth) / img.width;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST"
    );

    pdf.save(`Invoice-${invoiceNo}.pdf`);
}