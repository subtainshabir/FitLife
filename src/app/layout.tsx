import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

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
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
