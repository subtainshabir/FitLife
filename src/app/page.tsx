"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Languages,
  Sparkles,
  Dumbbell,
  Target,
  HeartPulse,
  Flame,
  CheckCircle2,
  Apple,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { t, isRtl } = useI18n();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 sm:py-16 md:py-24">
          <div className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-emerald-500/15 blur-[100px] sm:blur-[140px] rounded-full max-w-full" />
          <div className="pointer-events-none absolute top-40 end-5 sm:end-10 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-teal-500/10 blur-[90px] sm:blur-[130px] rounded-full max-w-full" />

          <div className="container relative px-4 sm:px-8 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-6 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Phase 1 Calibration Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.15] mb-4 sm:mb-6 break-words">
              {t.landing.heroTitle}{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                {t.landing.heroHighlight}
              </span>
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm sm:max-w-none mx-auto">
              {session?.user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" variant="gradient" className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-extrabold px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl shadow-emerald-500/25">
                    <span>{t.landing.goToDashboard}</span>
                    <ArrowRight className={`h-4 w-4 shrink-0 ${isRtl ? "rotate-180" : ""}`} />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button size="lg" variant="gradient" className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-extrabold px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl shadow-emerald-500/25">
                      <span>{t.landing.getStarted}</span>
                      <ArrowRight className={`h-4 w-4 shrink-0 ${isRtl ? "rotate-180" : ""}`} />
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-xs sm:text-sm font-bold px-6 sm:px-8 py-5 sm:py-6 rounded-2xl border-border/80 hover:bg-muted/60">
                      {t.auth.loginButton}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Quick Architecture Trust Badges */}
            <div className="mt-8 sm:mt-12 pt-6 border-t border-border/40 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-bold text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Next.js App Router</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Docker PostgreSQL 16</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Drizzle ORM & Auth.js</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>English & Urdu (RTL)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Feature Showcase with Photography */}
        <section className="py-12 sm:py-16 bg-muted/20 border-y border-border/60">
          <div className="container px-4 sm:px-8 max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
              <Badge variant="outline" className="mb-2 font-bold text-xs">
                Visual Architecture
              </Badge>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">
                Engineered for High-Performance Athletics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
                    alt="Precision Profiles"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 pt-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground">{t.landing.feature1Title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.landing.feature1Desc}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop"
                    alt="Dual Language RTL"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md">
                      <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 pt-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground">{t.landing.feature2Title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.landing.feature2Desc}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop"
                    alt="Secure Foundation"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-md">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 pt-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground">{t.landing.feature3Title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.landing.feature3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
