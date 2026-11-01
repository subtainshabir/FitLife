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
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-foreground">
              FitLife<span className="text-emerald-500">.AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground -mt-1">
              Phase 1
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="default" size="sm" className="font-bold text-xs rounded-xl shadow-sm">
                  {t.common.dashboard}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl"
              >
                {t.common.signOut}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-xs rounded-xl">
                  {t.common.signIn}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm" className="font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20">
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
