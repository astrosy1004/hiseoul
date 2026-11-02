import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "HiSeoul · K-Beauty & K-Pop delivered to your hotel",
  description: "Shop what travelers in Seoul are buying. Same store prices, same-day delivery to your hotel front desk.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#C2255C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
