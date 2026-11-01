"use client";

import React from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 transition-all text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 transition-all text-slate-700" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

