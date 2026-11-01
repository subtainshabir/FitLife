"use client";

import React from "react";
import Link from "next/link";
import { Activity, Dumbbell, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { t } = useI18n();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-[1.02] shrink-0 min-w-0"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20 shrink-0">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
              FitLife<span className="text-emerald-500">.AI</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-muted-foreground -mt-1 truncate">
              Smart Fitness
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <LanguageToggle />
          <ThemeToggle />

          {session?.user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/dashboard">
                <Button variant="default" size="sm" className="font-bold text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl shadow-sm">
                  {t.common.dashboard}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted-foreground hover:text-foreground text-[11px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 font-semibold rounded-xl hidden sm:inline-flex"
              >
                {t.common.signOut}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="font-semibold text-xs h-9 px-3 rounded-xl">
                  {t.common.signIn}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm" className="font-bold text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl shadow-md shadow-emerald-500/20">
                  {t.common.signUp}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
