export const printInvoice = (
    elementId: string,
    title: string
) => {
    const content =
        document.getElementById(elementId);

    if (!content) return;

    const printWindow = window.open(
        "",
        "_blank",
        "width=350,height=700"
    );

    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 80mm;
            background: #fff;
            color: #000;
            font-family: Arial, sans-serif;
            overflow: hidden;
          }

          body {
            padding: 6px;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 12px;
          }

          img {
            max-width: 100%;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          p {
            margin: 0;
            padding: 0;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .font-bold {
            font-weight: bold;
          }

          .border-t {
            border-top: 1px dashed #999;
          }

          .border-b {
            border-bottom: 1px dashed #999;
          }

          .border-dashed {
            border-style: dashed;
          }

          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }

          .pt-2 { padding-top: 8px; }
          .pt-3 { padding-top: 12px; }
          .pt-4 { padding-top: 16px; }

          .pb-2 { padding-bottom: 8px; }
          .pb-3 { padding-bottom: 12px; }
          .pb-4 { padding-bottom: 16px; }

          .flex {
            display: flex;
          }

          .justify-between {
            justify-content: space-between;
          }

          .w-full {
            width: 100%;
          }

          @media print {
            html,
            body {
              width: 80mm;
            }

            body {
              margin: 0;
            }
          }
        </style>
      </head>

      <body onload="window.print(); window.close();">
        ${content.innerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
};