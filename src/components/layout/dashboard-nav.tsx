"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Home,
  Calculator,
  Target,
  Utensils,
  Dumbbell,
  LineChart,
  User,
  Sparkles,
  LogOut,
  Menu,
  X,
  Lock,
  Building,
  Scale,
  BookOpen,
  Droplet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";

export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const navItems = [
    {
      name: t.common.home,
      href: "/dashboard",
      icon: Home,
      functional: true,
    },
    {
      name: t.common.assessment,
      href: "/assessment",
      icon: Calculator,
      functional: true,
    },
    {
      name: t.common.goals,
      href: "/goals",
      icon: Target,
      functional: true,
    },
    {
      name: t.common.nutrition,
      href: "/nutrition",
      icon: Sparkles,
      functional: true,
    },
    {
      name: t.common.diary,
      href: "/diary",
      icon: BookOpen,
      functional: true,
    },
    {
      name: t.common.foods,
      href: "/foods",
      icon: Utensils,
      functional: true,
    },
    {
      name: t.common.prices,
      href: "/prices",
      icon: Building,
      functional: true,
    },
    {
      name: t.common.calculator,
      href: "/calculator",
      icon: Scale,
      functional: true,
    },
    {
      name: t.common.exercises,
      href: "/exercises",
      icon: Dumbbell,
      functional: true,
    },
    {
      name: t.common.workouts,
      href: "/workouts",
      icon: Activity,
      functional: true,
    },
    {
      name: t.common.profile,
      href: "/profile",
      icon: User,
      functional: true,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
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
                  Fitness AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.functional && pathname === item.href;

                if (!item.functional) {
                  return (
                    <div
                      key={item.name}
                      className="group relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground/60 cursor-not-allowed rounded-lg hover:bg-muted/30 transition-colors"
                      title={t.common.comingSoon}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground border border-border/80">
                        Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Visual AI Coach Callout - Visible on desktop */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="hidden lg:inline-flex relative items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t.common.aiCoach}</span>
              <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9px] uppercase font-extrabold tracking-wider">
                Phase 2
              </span>
            </button>

            <LanguageToggle />
            <ThemeToggle />

            {/* User pill & sign out */}
            <div className="hidden sm:flex items-center gap-2 border-s border-border/60 ps-3">
              <Link href="/profile">
                <div className="flex items-center gap-2 rounded-xl p-1 hover:bg-muted/60 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-emerald-500/20">
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-xs font-bold max-w-[90px] truncate text-foreground">
                    {session?.user?.name || "Athlete"}
                  </span>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                title={t.common.signOut}
                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="border-b border-border/60 bg-card/95 backdrop-blur-xl px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">
                  {session?.user?.name || "Athlete"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {session?.user?.email}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.functional && pathname === item.href;

                if (!item.functional) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground/60 rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {t.common.comingSoon}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAiModal(true);
                }}
                className="flex items-center justify-between px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-1"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>{t.common.aiCoach}</span>
                </div>
                <Badge variant="comingSoon" className="text-[9px]">
                  Phase 2
                </Badge>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs font-semibold"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 me-2" />
              {t.common.signOut}
            </Button>
          </div>
        )}
      </header>

      {/* Floating Bottom Nav for Mobile Screens */}
      <div className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-1 py-1 shadow-2xl flex items-center justify-around h-14">
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname === "/dashboard"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Home className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.home}</span>
        </Link>

        <Link
          href="/assessment"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname === "/assessment"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Calculator className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.assessment}</span>
        </Link>

        <Link
          href="/goals"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname === "/goals"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Target className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.goals}</span>
        </Link>

        <Link
          href="/nutrition"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname === "/nutrition"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.nutrition}</span>
        </Link>

        <Link
          href="/foods"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname.startsWith("/foods")
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Utensils className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.foods}</span>
        </Link>

        <Link
          href="/exercises"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname.startsWith("/exercises")
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Dumbbell className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.exercises}</span>
        </Link>

        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all min-w-0 ${
            pathname === "/profile"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-semibold truncate max-w-[50px]">{t.common.profile}</span>
        </Link>
      </div>

      {/* AI Coach Visual Preview Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-emerald-500/30 bg-card p-5 sm:p-6 shadow-2xl relative text-start overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Top decorative gradient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  FitLife {t.common.aiCoach}
                </h3>
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 2 Feature
                </Badge>
              </div>
            </div>

            {/* Visual preview graphic */}
            <div className="relative rounded-2xl overflow-hidden mb-4 border border-border/80 h-32 bg-slate-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop"
                alt="AI Fitness Companion"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                loading="lazy"
              />
              <div className="relative z-10 text-center px-4">
                <span className="text-xs font-bold text-white drop-shadow">
                  Intelligent Workout & Diet Reasoning
                </span>
                <p className="text-[11px] text-emerald-200/90 mt-1">
                  Activating in Phase 2
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {t.dashboard.aiCoachDesc}
            </p>

            <div className="rounded-xl border border-border/80 bg-muted/40 p-3 mb-5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>Phase 1 Compliance:</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                All physical profile parameters, equipment, and dietary restrictions configured in Phase 1 are ready to seed the AI model once Phase 2 begins.
              </p>
            </div>

            <Button
              variant="default"
              className="w-full text-xs font-bold py-2.5 rounded-xl shadow-md"
              onClick={() => setShowAiModal(false)}
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
