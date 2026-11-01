"use client";

import React from "react";
import { Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-border/40 bg-background/50 py-6 sm:py-8 backdrop-blur-sm">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-8 text-[11px] sm:text-xs text-muted-foreground text-center sm:text-start">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-semibold text-foreground">
            FitLife<span className="text-emerald-500">.AI</span>
          </span>
          <span className="hidden xs:inline">&mdash;</span>
          <span className="break-words">{t.common.tagline}</span>
        </div>
        <div className="break-words text-center sm:text-end">
          <span>Local Docker PostgreSQL &bull; Next.js 14 &bull; Auth.js</span>
        </div>
      </div>
    </footer>
  );
}

