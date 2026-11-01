"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const { t, isRtl } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "Failed to create account. Please try again.");
        }
        setLoading(false);
        return;
      }

      setSuccessMessage(t.auth.registrationSuccess);

      // Automatically sign in the user
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 1200);
      } else {
        setTimeout(() => {
          router.push("/onboarding");
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setGeneralError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl grid grid-cols-1 lg:grid-cols-2">
          {/* Visual Column */}
          <div className="relative hidden lg:flex flex-col justify-between p-8 bg-slate-950 text-white overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop"
              alt="Athlete Preparation"
              className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5 text-emerald-400" />
                <span>Begin Your Journey</span>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs uppercase tracking-wider font-extrabold">Next-Gen Fitness</span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-md">
                Calibrate your physical foundation today.
              </h2>
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Secure Schema</span>
                </div>
                <span>&bull;</span>
                <span>Personalized Onboarding</span>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="p-6 sm:p-10 flex flex-col justify-center bg-card">
            <div className="space-y-1 mb-6 text-start">
              <div className="lg:hidden inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>New Athlete</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t.auth.registerTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t.auth.registerSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {generalError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-bold text-foreground">
                  {t.auth.fullName}
                </Label>
                <div className="relative">
                  <User className="absolute start-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder={t.auth.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ps-9 h-11 rounded-xl text-xs bg-muted/30 focus:bg-background"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-destructive">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
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
                {fieldErrors.email && (
                  <p className="text-[11px] text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-bold text-foreground">
                  {t.auth.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={t.auth.passwordPlaceholder}
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
                {fieldErrors.password ? (
                  <p className="text-[11px] text-destructive">{fieldErrors.password[0]}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Min 8 characters, 1 uppercase, 1 lowercase, 1 number.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl mt-3"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.auth.registering}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{t.auth.registerButton}</span>
                    <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                  </span>
                )}
              </Button>

              <div className="text-center pt-2 text-xs text-muted-foreground">
                <span>{t.auth.alreadyHaveAccount} </span>
                <Link
                  href="/login"
                  className="font-bold text-primary hover:underline"
                >
                  {t.auth.loginButton}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
