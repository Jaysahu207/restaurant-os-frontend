import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import AuthInitializer from "@/components/AuthInitializer";
import "@/styles/print.css";
import SocketProvider from "@/providers/SocketProvider";
import { Poppins, Inter } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} bg-gray-50 text-gray-900 }`}
      >
        <QueryProvider>
          <SocketProvider>
            <AuthInitializer />
            {children}
          </SocketProvider>

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
