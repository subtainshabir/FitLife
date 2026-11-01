"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/80 bg-background/50 p-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          language === "en"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ur")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          language === "ur"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>اردو</span>
      </button>
    </div>
  );
}

