"use client";

import React from "react";
import { Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-border/40 bg-background/50 py-8 backdrop-blur-sm">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-foreground">
            FitLife<span className="text-emerald-500">.AI</span>
          </span>
          <span>&mdash; {t.common.tagline}</span>
        </div>
        <div>
          <span>Phase 1 Implementation &bull; Local Docker PostgreSQL &bull; Auth.js</span>
        </div>
      </div>
    </footer>
  );
}

