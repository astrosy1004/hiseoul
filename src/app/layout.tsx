import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "HiSeoul · K-Shopping delivered to your hotel",
  description: "Buy the best of K-Beauty, K-Pop and more. Same-day delivery to your hotel in Seoul.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <StoreProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
