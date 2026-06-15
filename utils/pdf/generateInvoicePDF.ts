export async function generateInvoicePDF(
    element: HTMLElement,
    invoiceNo: string
) {
    if (typeof window === "undefined") return;

    const [{ default: jsPDF }, { default: html2canvas }] =
        await Promise.all([
            import("jspdf"),
            import("html2canvas"),
        ]);
    const allElements = document.querySelectorAll("*");

    for (const el of allElements) {
        const styles = getComputedStyle(el);

        const values = [
            styles.color,
            styles.backgroundColor,
            styles.borderColor,
            styles.outlineColor,
        ];

        for (const value of values) {
            if (
                value.includes("lab(") ||
                value.includes("oklab(") ||
                value.includes("oklch(")
            ) {
                console.log("FOUND:", el, value);
            }
        }
    }
    // DEBUG END
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = 80;
    const pdfHeight =
        (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight
    );

    pdf.save(`Invoice-${invoiceNo}.pdf`);
}