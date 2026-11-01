"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();

  const isJustRegistered = searchParams.get("registered") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(t.auth.invalidCredentials);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-2xl grid grid-cols-1 lg:grid-cols-2">
      {/* Visual Photography Column */}
      <div className="relative hidden lg:flex flex-col justify-between p-8 bg-slate-950 text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop"
          alt="Fitness Training"
          className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Top Tag */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>FitLife AI Phase 1</span>
          </div>
        </div>

        {/* Bottom Motivational Quote Card */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Dumbbell className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-extrabold">Athlete Portal</span>
          </div>
          <h2 className="text-2xl font-black leading-tight text-white drop-shadow-md">
            Train with clarity.<br />Measure with precision.
          </h2>
          <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Encrypted Sessions</span>
            </div>
            <span>&bull;</span>
            <span>Bi-Lingual RTL</span>
          </div>
        </div>
      </div>

      {/* Form Column */}
      <div className="p-4 sm:p-8 md:p-10 flex flex-col justify-center bg-card">
        <div className="space-y-1 mb-6 text-start">
          <div className="lg:hidden inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            <Dumbbell className="h-3.5 w-3.5" />
            <span>FitLife AI</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t.auth.loginTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.auth.loginSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isJustRegistered && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Account created! Please sign in.</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-foreground">
              {t.auth.email}
            </Label>
            <div className="relative">
              <Mail className="absolute start-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                required
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-9 h-11 rounded-xl text-xs bg-muted/30 focus:bg-background"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-foreground">
              {t.auth.password}
            </Label>
            <div className="relative">
              <Lock className="absolute start-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ps-9 pe-10 h-11 rounded-xl text-xs bg-muted/30 focus:bg-background"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground"
                title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-11 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.auth.loggingIn}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>{t.auth.loginButton}</span>
                <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
              </span>
            )}
          </Button>

          <div className="text-center pt-3 text-xs text-muted-foreground">
            <span>{t.auth.dontHaveAccount} </span>
            <Link
              href="/register"
              className="font-bold text-primary hover:underline"
            >
              {t.auth.registerButton}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-6 sm:py-10 px-3 sm:px-6">
        <Suspense fallback={<div className="text-center p-8 text-xs text-muted-foreground">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
