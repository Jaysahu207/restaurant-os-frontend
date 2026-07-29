// src/utils/printConfig.ts

export type PrinterSize = "58mm" | "80mm";

/**
 * Builds the pageStyle string passed into useReactToPrint's `pageStyle` option.
 */
export function getPageStyle(size: PrinterSize): string {
    const width = size === "58mm" ? "58mm" : "80mm";

    return `
    @page {
      size: ${width} auto; /* explicit height avoids "auto" landscape bugs on some drivers */
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: ${width};
      max-width: ${width};
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  `;
}

/**
 * Call this right before printing so print.css's body.print-58mm rules apply.
 */
export function applyPrintBodyClass(size: PrinterSize) {
    document.body.classList.remove("print-58mm", "print-80mm");
    document.body.classList.add(size === "58mm" ? "print-58mm" : "print-80mm");
}

export function clearPrintBodyClass() {
    document.body.classList.remove("print-58mm", "print-80mm");
}