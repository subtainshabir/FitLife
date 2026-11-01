import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "FitLife AI - Smart Health & Fitness Companion",
  description: "Next-generation intelligent fitness, nutrition, and wellness platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden min-w-0">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
