import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900">
        <QueryProvider>
          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
