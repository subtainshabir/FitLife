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
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/15 blur-[140px] rounded-full" />
          <div className="pointer-events-none absolute top-40 end-10 w-[400px] h-[400px] bg-teal-500/10 blur-[130px] rounded-full" />

          <div className="container relative px-4 sm:px-8 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-6 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phase 1 Calibration Hub</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
              {t.landing.heroTitle}{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                {t.landing.heroHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {session?.user ? (
                <Link href="/dashboard">
                  <Button size="lg" variant="gradient" className="gap-2 text-xs sm:text-sm font-extrabold px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/25">
                    <span>{t.landing.goToDashboard}</span>
                    <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" variant="gradient" className="gap-2 text-xs sm:text-sm font-extrabold px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/25">
                      <span>{t.landing.getStarted}</span>
                      <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="text-xs sm:text-sm font-bold px-8 py-6 rounded-2xl border-border/80 hover:bg-muted/60">
                      {t.auth.loginButton}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Quick Architecture Trust Badges */}
            <div className="mt-12 pt-6 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Next.js App Router</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Docker PostgreSQL 16</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Drizzle ORM & Auth.js</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>English & Urdu (RTL)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Feature Showcase with Photography */}
        <section className="py-16 bg-muted/20 border-y border-border/60">
          <div className="container px-4 sm:px-8 max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <Badge variant="outline" className="mb-2 font-bold text-xs">
                Visual Architecture
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Engineered for High-Performance Athletics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
                    alt="Precision Profiles"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Target className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-2">
                  <h3 className="text-base font-extrabold text-foreground">{t.landing.feature1Title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.landing.feature1Desc}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop"
                    alt="Dual Language RTL"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md">
                      <Languages className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-2">
                  <h3 className="text-base font-extrabold text-foreground">{t.landing.feature2Title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.landing.feature2Desc}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop"
                    alt="Secure Foundation"
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 start-4">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-md">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-2">
                  <h3 className="text-base font-extrabold text-foreground">{t.landing.feature3Title}</h3>
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
