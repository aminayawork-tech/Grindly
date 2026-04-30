import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Grindly — Personal Growth Tracking",
  description: "Your personal trainer, nutritionist, and life coach in one app.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F7]">
        <StoreProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
              <div className="max-w-4xl mx-auto px-4 py-6">
                {children}
              </div>
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
