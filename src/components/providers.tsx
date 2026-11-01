"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="system">
        <I18nProvider initialLanguage="en">
          {children}
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

