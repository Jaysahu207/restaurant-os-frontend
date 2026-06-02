export const printInvoice = (elementId: string, title = "Invoice") => {
  const content = document.getElementById(elementId);

  if (!content) return;

  const printWindow = window.open("", "", "width=400,height=800");

  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 80mm;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }

          #print-area {
            width: 80mm;
            padding: 8px;
            box-sizing: border-box;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          img {
            max-width: 100%;
          }
        </style>
      </head>

      <body>
        <div id="print-area">
          ${content.innerHTML}
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};