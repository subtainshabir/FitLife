"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
  User,
  Target,
  Dumbbell,
  Apple,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Flame,
  Scale,
  Layers,
  Award,
  HeartPulse,
  Heart,
  Zap,
  MapPin,
  Calendar,
  Languages,
  DollarSign,
  Shield,
  Activity,
} from "lucide-react";
import { FITNESS_GOALS, ACTIVITY_LEVELS, FITNESS_EXPERIENCES } from "@/lib/validations/profile";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, setLanguage, isRtl } = useI18n();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("1998-01-01");
  const [gender, setGender] = useState<string>("male");
  const [height, setHeight] = useState<string>("175");
  const [currentWeight, setCurrentWeight] = useState<string>("70");
  const [country, setCountry] = useState("Pakistan");
  const [city, setCity] = useState("Lahore");
  const [preferredCurrency, setPreferredCurrency] = useState("PKR");
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "ur">("en");

  const [fitnessGoal, setFitnessGoal] = useState<string>("muscle_building");
  const [fitnessExperience, setFitnessExperience] = useState<string>("beginner");
  const [activityLevel, setActivityLevel] = useState<string>("moderately_active");

  const [availableEquipment, setAvailableEquipment] = useState<string[]>([
    "dumbbells",
    "bodyweight",
  ]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([
    "high_protein",
  ]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([
    "halal",
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/onboarding");
      return;
    }

    if (session?.user?.name) {
      setName(session.user.name);
    }

    async function loadExisting() {
      try {
        const res = await fetch("/api/v1/profiles/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            if (p.dateOfBirth) setDateOfBirth(p.dateOfBirth);
            if (p.gender) setGender(p.gender);
            if (p.height) setHeight(p.height.toString());
            if (p.currentWeight) setCurrentWeight(p.currentWeight.toString());
            if (p.country) setCountry(p.country);
            if (p.city) setCity(p.city);
            if (p.preferredCurrency) setPreferredCurrency(p.preferredCurrency);
            if (p.preferredLanguage) {
              setPreferredLanguage(p.preferredLanguage);
              setLanguage(p.preferredLanguage);
            }
            if (p.fitnessGoal) setFitnessGoal(p.fitnessGoal);
            if (p.fitnessExperience) setFitnessExperience(p.fitnessExperience);
            if (p.activityLevel) setActivityLevel(p.activityLevel);
            if (p.availableEquipment?.length) setAvailableEquipment(p.availableEquipment);
            if (p.dietaryPreferences?.length) setDietaryPreferences(p.dietaryPreferences);
            if (p.allergies?.length) setAllergies(p.allergies);
            if (p.dietaryRestrictions?.length) setDietaryRestrictions(p.dietaryRestrictions);
          }
        }
      } catch (e) {
        console.error("Failed to load existing profile:", e);
      }
    }

    if (status === "authenticated") {
      loadExisting();
    }
  }, [status, session, router, setLanguage]);

  const toggleArrayItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return false;
      }
      const h = parseFloat(height);
      if (isNaN(h) || h < 50 || h > 300) {
        setError("Please enter a valid height (50 - 300 cm).");
        return false;
      }
      const w = parseFloat(currentWeight);
      if (isNaN(w) || w < 20 || w > 500) {
        setError("Please enter a valid weight (20 - 500 kg).");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        dateOfBirth,
        gender,
        height: parseFloat(height),
        currentWeight: parseFloat(currentWeight),
        country,
        city,
        preferredCurrency,
        preferredLanguage,
        fitnessGoal,
        fitnessExperience,
        activityLevel,
        availableEquipment,
        dietaryPreferences,
        allergies,
        dietaryRestrictions,
      };

      const res = await fetch("/api/v1/profiles/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save profile.");
        setLoading(false);
        return;
      }

      if (preferredLanguage) {
        setLanguage(preferredLanguage);
      }

      router.push("/dashboard?onboarded=true");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while saving profile.");
      setLoading(false);
    }
  };

  // Goal icon lookup
  const goalIcons: Record<string, React.ReactNode> = {
    weight_gain: <TrendingUp className="h-5 w-5 text-emerald-500" />,
    weight_loss: <TrendingDown className="h-5 w-5 text-emerald-500" />,
    muscle_building: <Dumbbell className="h-5 w-5 text-emerald-500" />,
    fat_reduction: <Flame className="h-5 w-5 text-emerald-500" />,
    weight_maintenance: <Scale className="h-5 w-5 text-emerald-500" />,
    body_recomposition: <Layers className="h-5 w-5 text-emerald-500" />,
    strength_improvement: <Award className="h-5 w-5 text-emerald-500" />,
    endurance: <HeartPulse className="h-5 w-5 text-emerald-500" />,
    general_fitness: <Heart className="h-5 w-5 text-emerald-500" />,
  };

  const equipmentCards = [
    { id: "bodyweight", label: "Bodyweight", icon: Activity },
    { id: "dumbbells", label: "Dumbbells", icon: Dumbbell },
    { id: "barbells", label: "Barbells", icon: Zap },
    { id: "resistance_bands", label: "Bands", icon: Layers },
    { id: "kettlebells", label: "Kettlebells", icon: Award },
    { id: "pull_up_bar", label: "Pull-Up Bar", icon: Shield },
    { id: "full_gym", label: "Full Gym", icon: Sparkles },
  ];

  const dietCards = [
    { id: "standard", label: "Standard", desc: "Balanced diet" },
    { id: "high_protein", label: "High Protein", desc: "For muscle repair" },
    { id: "low_carb", label: "Low Carb", desc: "Reduced carbs" },
    { id: "keto", label: "Keto", desc: "High fat, zero carb" },
    { id: "vegetarian", label: "Vegetarian", desc: "Plant-forward" },
    { id: "vegan", label: "Vegan", desc: "100% plant based" },
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0 selection:bg-primary selection:text-primary-foreground">
      <DashboardNav />

      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Visual Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step {step} of 4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {t.onboarding.title}
            </h1>
          </div>

          {/* Stepper Progress Bar with Icons */}
          <div className="mb-6">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 start-4 end-4 -translate-y-1/2 h-1 bg-muted rounded-full -z-0" />
              <div
                className="absolute top-1/2 start-4 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 -z-0"
                style={{ width: `${((step - 1) / 3) * 88}%` }}
              />

              {[
                { s: 1, icon: User },
                { s: 2, icon: Target },
                { s: 3, icon: Dumbbell },
                { s: 4, icon: Apple },
              ].map(({ s, icon: StepIcon }) => (
                <div
                  key={s}
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all ${
                    s < step
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : s === step
                      ? "border-emerald-500 bg-background text-emerald-500 ring-4 ring-emerald-500/20 shadow-md"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[11px] font-bold text-muted-foreground mt-2 px-1">
              <span>{t.onboarding.step1Title}</span>
              <span>{t.onboarding.step2Title}</span>
              <span>{t.onboarding.step3Title}</span>
              <span>{t.onboarding.step4Title}</span>
            </div>
          </div>

          {/* Step Content Container */}
          <Card className="border-border/80 shadow-2xl bg-card rounded-3xl overflow-hidden">
            {error && (
              <div className="m-6 mb-0 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <CardContent className="p-6 sm:p-8">
              {/* STEP 1: Personal Attributes */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-500" />
                      <span>Personal Profile</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">Basic physical metrics for calibration.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="name" className="text-xs font-bold text-foreground">
                        {t.auth.fullName}
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/30"
                        placeholder="Alex Morgan"
                      />
                    </div>

                    {/* Date of birth */}
                    <div className="space-y-1">
                      <Label htmlFor="dob" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.dob}</span>
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/30"
                      />
                    </div>

                    {/* Gender Selection Cards */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">
                        {t.onboarding.gender}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["male", "female"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`h-11 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                              gender === g
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                                : "border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {g === "male" ? t.onboarding.male : t.onboarding.female}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Height with visual unit */}
                    <div className="space-y-1">
                      <Label htmlFor="height" className="text-xs font-bold text-foreground">
                        {t.onboarding.height}
                      </Label>
                      <div className="relative">
                        <Input
                          id="height"
                          type="number"
                          min="50"
                          max="300"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="h-11 rounded-xl text-xs bg-muted/30 pe-12 font-bold"
                          placeholder="175"
                        />
                        <span className="absolute end-3 top-3 text-xs font-bold text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </div>

                    {/* Weight with visual unit */}
                    <div className="space-y-1">
                      <Label htmlFor="weight" className="text-xs font-bold text-foreground">
                        {t.onboarding.weight}
                      </Label>
                      <div className="relative">
                        <Input
                          id="weight"
                          type="number"
                          min="20"
                          max="500"
                          value={currentWeight}
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          className="h-11 rounded-xl text-xs bg-muted/30 pe-12 font-bold"
                          placeholder="70"
                        />
                        <span className="absolute end-3 top-3 text-xs font-bold text-muted-foreground">
                          kg
                        </span>
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                      <Label htmlFor="country" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.country}</span>
                      </Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/30"
                        placeholder="Pakistan"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs font-bold text-foreground">
                        {t.onboarding.city}
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/30"
                        placeholder="Lahore"
                      />
                    </div>

                    {/* Currency */}
                    <div className="space-y-1">
                      <Label htmlFor="currency" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.currency}</span>
                      </Label>
                      <select
                        id="currency"
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-muted/30 px-3 text-xs font-bold"
                      >
                        <option value="PKR">PKR (₨) - Pakistan</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                        <option value="SAR">SAR (﷼) - Saudi Riyal</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-1">
                      <Label htmlFor="language" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.common.language}</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreferredLanguage("en");
                            setLanguage("en");
                          }}
                          className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all ${
                            preferredLanguage === "en"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                              : "border-border bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreferredLanguage("ur");
                            setLanguage("ur");
                          }}
                          className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all ${
                            preferredLanguage === "ur"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                              : "border-border bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          اردو (Urdu)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Fitness Goals (Visual Cards) */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      <span>{t.onboarding.fitnessGoal}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">Select your primary fitness objective.</p>
                  </div>

                  {/* 3x3 Visual Goal Grid with Icons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FITNESS_GOALS.map((g) => {
                      const isSelected = fitnessGoal === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFitnessGoal(g)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
                              : "border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 transition-transform ${
                            isSelected ? "bg-emerald-500 text-white scale-110 shadow-sm" : "bg-muted text-muted-foreground"
                          }`}>
                            {goalIcons[g] || <Activity className="h-5 w-5" />}
                          </div>
                          <span className="text-xs font-bold line-clamp-1">{t.goals[g] || g}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Experience Level Cards */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.fitnessExperience}
                    </Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {FITNESS_EXPERIENCES.map((exp) => {
                        const isSelected = fitnessExperience === exp;
                        return (
                          <button
                            key={exp}
                            type="button"
                            onClick={() => setFitnessExperience(exp)}
                            className={`p-3 rounded-2xl border text-center transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30 font-bold"
                                : "border-border/80 bg-muted/20 text-muted-foreground font-semibold hover:bg-muted/40"
                            }`}
                          >
                            <span className="text-xs capitalize block">{t.experiences[exp] || exp}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Level Meter */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.activityLevel}
                    </Label>
                    <div className="space-y-2">
                      {ACTIVITY_LEVELS.map((act, idx) => {
                        const isSelected = activityLevel === act;
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setActivityLevel(act)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-start text-xs transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/30 font-bold"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex gap-0.5">
                                {[0, 1, 2, 3, 4].map((bar) => (
                                  <span
                                    key={bar}
                                    className={`h-3 w-1 rounded-full ${
                                      bar <= idx
                                        ? isSelected ? "bg-emerald-500" : "bg-muted-foreground/60"
                                        : "bg-muted/60"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span>{t.activityLevels[act] || act}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Lifestyle & Equipment (Visual Cards) */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-emerald-500" />
                      <span>{t.onboarding.availableEquipment}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">Select all gear available to you.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {equipmentCards.map((item) => {
                      const Icon = item.icon;
                      const isSelected = availableEquipment.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(availableEquipment, setAvailableEquipment, item.id)
                          }
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
                              : "border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-2 ${
                            isSelected ? "bg-emerald-500 text-white shadow-sm" : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold">{item.label}</span>
                          {isSelected && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-1">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Diet & Preferences */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Apple className="h-4 w-4 text-emerald-500" />
                      <span>{t.onboarding.step4Title}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">Nutrition habits & restrictions.</p>
                  </div>

                  {/* Dietary Preferences Cards */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.dietaryPreferences}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {dietCards.map((diet) => {
                        const isSelected = dietaryPreferences.includes(diet.id);
                        return (
                          <button
                            key={diet.id}
                            type="button"
                            onClick={() =>
                              toggleArrayItem(dietaryPreferences, setDietaryPreferences, diet.id)
                            }
                            className={`p-3 rounded-2xl border text-start transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/30"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <span className="text-xs font-bold block">{diet.label}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{diet.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.dietaryRestrictions}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "halal", label: "Halal (حلال)" },
                        { id: "kosher", label: "Kosher" },
                        { id: "gluten_free", label: "Gluten-Free" },
                        { id: "lactose_free", label: "Lactose-Free" },
                        { id: "none", label: "None" },
                      ].map((res) => {
                        const isSelected = dietaryRestrictions.includes(res.id);
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() =>
                              toggleArrayItem(dietaryRestrictions, setDietaryRestrictions, res.id)
                            }
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            {res.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Food Allergies */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.allergies}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {["peanuts", "tree_nuts", "dairy", "eggs", "gluten", "shellfish", "none"].map((alg) => {
                        const isSelected = allergies.includes(alg);
                        return (
                          <button
                            key={alg}
                            type="button"
                            onClick={() => toggleArrayItem(allergies, setAllergies, alg)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                              isSelected
                                ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/30"
                                : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            {alg.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/60 p-4 sm:px-8 bg-muted/10">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="gap-2 text-xs font-bold rounded-xl"
                >
                  <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                  <span>{t.common.back}</span>
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleNext}
                  className="gap-2 text-xs font-bold rounded-xl shadow-md"
                >
                  <span>{t.common.next}</span>
                  <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleComplete}
                  disabled={loading}
                  className="gap-2 text-xs font-extrabold px-6 rounded-xl shadow-lg shadow-emerald-500/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t.common.saving}</span>
                    </span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{t.onboarding.completeOnboarding}</span>
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
