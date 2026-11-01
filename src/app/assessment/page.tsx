"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BmiIndicator } from "@/components/ui/bmi-indicator";
import { MacroBreakdown } from "@/components/ui/macro-breakdown";
import { useI18n } from "@/lib/i18n/context";
import {
  Activity,
  Calculator,
  Flame,
  HeartPulse,
  Scale,
  Ruler,
  HelpCircle,
  Sparkles,
  Zap,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { BodyAssessment } from "@/db/schema";
import {
  ACTIVITY_LEVELS,
  FITNESS_EXPERIENCES,
  FITNESS_GOALS,
  GENDERS,
} from "@/lib/validations/profile";
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg } from "@/lib/services/fitness-calculator";

export default function AssessmentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, isRtl } = useI18n();

  // Unit system
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  // Form State
  const [age, setAge] = useState<number | "">(25);
  const [gender, setGender] = useState<string>("male");
  const [heightCm, setHeightCm] = useState<number | "">(175);
  const [heightFeet, setHeightFeet] = useState<number | "">(5);
  const [heightInches, setHeightInches] = useState<number | "">(9);
  const [weightKg, setWeightKg] = useState<number | "">(70);
  const [weightLbs, setWeightLbs] = useState<number | "">(154);
  const [activityLevel, setActivityLevel] = useState<string>("moderately_active");
  const [fitnessExperience, setFitnessExperience] = useState<string>("intermediate");
  const [primaryGoal, setPrimaryGoal] = useState<string>("muscle_building");
  const [showSexExplanation, setShowSexExplanation] = useState(false);

  // Results & History State
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<BodyAssessment | null>(null);
  const [history, setHistory] = useState<BodyAssessment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial data from existing profile & latest assessment
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/assessment");
      return;
    }

    async function loadData() {
      try {
        // Fetch user profile
        const profRes = await fetch("/api/v1/users/me");
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.profile) {
            const p = profData.profile;
            if (p.height) {
              setHeightCm(p.height);
              const ftin = cmToFtIn(p.height);
              setHeightFeet(ftin.feet);
              setHeightInches(ftin.inches);
            }
            if (p.currentWeight) {
              setWeightKg(p.currentWeight);
              setWeightLbs(kgToLbs(p.currentWeight));
            }
            if (p.gender) setGender(p.gender);
            if (p.activityLevel) setActivityLevel(p.activityLevel);
            if (p.fitnessExperience) setFitnessExperience(p.fitnessExperience);
            if (p.fitnessGoal) setPrimaryGoal(p.fitnessGoal);

            // Compute age from dateOfBirth if available
            if (p.dateOfBirth) {
              const birth = new Date(p.dateOfBirth);
              const diff = Date.now() - birth.getTime();
              const computedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
              if (computedAge >= 10 && computedAge <= 120) {
                setAge(computedAge);
              }
            }
          }
        }

        // Fetch latest assessment
        const assessRes = await fetch("/api/v1/assessments/latest");
        if (assessRes.ok) {
          const assessData = await assessRes.json();
          if (assessData.assessment) {
            setCurrentAssessment(assessData.assessment);
            // If assessment had more recent height/weight
            if (assessData.assessment.height) {
              setHeightCm(assessData.assessment.height);
              const ftin = cmToFtIn(assessData.assessment.height);
              setHeightFeet(ftin.feet);
              setHeightInches(ftin.inches);
            }
            if (assessData.assessment.weight) {
              setWeightKg(assessData.assessment.weight);
              setWeightLbs(kgToLbs(assessData.assessment.weight));
            }
            if (assessData.assessment.age) setAge(assessData.assessment.age);
            if (assessData.assessment.gender) setGender(assessData.assessment.gender);
            if (assessData.assessment.activityLevel) setActivityLevel(assessData.assessment.activityLevel);
            if (assessData.assessment.primaryGoal) setPrimaryGoal(assessData.assessment.primaryGoal);
          }
        }

        // Fetch history
        const histRes = await fetch("/api/v1/assessments/history");
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.assessments || []);
        }
      } catch (err) {
        console.error("Failed to load assessment data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      loadData();
    }
  }, [status, router]);

  // Handle unit conversions on switcher click
  const handleUnitToggle = (newUnit: "metric" | "imperial") => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    if (newUnit === "imperial") {
      // Metric -> Imperial
      if (typeof weightKg === "number") {
        setWeightLbs(kgToLbs(weightKg));
      }
      if (typeof heightCm === "number") {
        const fi = cmToFtIn(heightCm);
        setHeightFeet(fi.feet);
        setHeightInches(fi.inches);
      }
    } else {
      // Imperial -> Metric
      if (typeof weightLbs === "number") {
        setWeightKg(lbsToKg(weightLbs));
      }
      if (typeof heightFeet === "number" && typeof heightInches === "number") {
        setHeightCm(ftInToCm(heightFeet, heightInches));
      }
    }
  };

  // Keep numbers in sync when inputs change
  const handleCmChange = (cmVal: number) => {
    setHeightCm(cmVal);
    const fi = cmToFtIn(cmVal);
    setHeightFeet(fi.feet);
    setHeightInches(fi.inches);
  };

  const handleFtInChange = (feet: number, inches: number) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    setHeightCm(ftInToCm(feet, inches));
  };

  const handleKgChange = (kgVal: number) => {
    setWeightKg(kgVal);
    setWeightLbs(kgToLbs(kgVal));
  };

  const handleLbsChange = (lbsVal: number) => {
    setWeightLbs(lbsVal);
    setWeightKg(lbsToKg(lbsVal));
  };

  // Form submission
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const finalHeightCm = typeof heightCm === "number" ? heightCm : 175;
      const finalWeightKg = typeof weightKg === "number" ? weightKg : 70;
      const finalAge = typeof age === "number" ? age : 25;

      const payload = {
        age: finalAge,
        height: finalHeightCm,
        weight: finalWeightKg,
        unit: "metric",
        gender,
        activityLevel,
        fitnessExperience,
        primaryGoal,
        saveToProfile: true,
      };

      const res = await fetch("/api/v1/assessments/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to calculate assessment.");
        setCalculating(false);
        return;
      }

      setCurrentAssessment(data.assessment);
      setSuccessMessage("Assessment recalculated and saved successfully!");

      // Refresh history list
      const histRes = await fetch("/api/v1/assessments/history");
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.assessments || []);
      }
    } catch (err) {
      console.error("Assessment submit error:", err);
      setError("An unexpected network error occurred.");
    } finally {
      setCalculating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Parse notes from calculation for display
  const calculationNotes = (currentAssessment?.calculationNotes as Record<string, any>) || {};
  const macroPcts = calculationNotes.macroPercentages || {
    protein: 25,
    carbs: 50,
    fat: 25,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardNav />

      <main className="flex-1 container mx-auto px-3 sm:px-6 md:px-8 py-6 sm:py-8 pb-24 md:pb-12 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Calculator className="h-3.5 w-3.5 shrink-0" />
                <span>{t.assessment.calculatorBadge}</span>
              </span>
              <span className="text-xs text-muted-foreground">Mifflin-St Jeor &bull; WHO BMI</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight mt-1 break-words">
              {t.assessment.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t.assessment.subtitle}
            </p>
          </div>

          {/* Unit Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-muted/70 p-1 sm:p-1.5 rounded-2xl border border-border/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleUnitToggle("metric")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                unit === "metric"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.common.metric}
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle("imperial")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                unit === "imperial"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.common.imperial}
            </button>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 sm:p-4 text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 sm:p-4 text-destructive animate-in fade-in text-xs font-bold">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* LEFT COLUMN: Input Form Card (5 cols) */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <Card className="rounded-2xl sm:rounded-3xl border-border/80 shadow-md">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span>{t.assessment.measurementsTitle}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t.assessment.updateNotice}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <form onSubmit={handleCalculate} className="space-y-4">
                  {/* Age & Biological Sex row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-xs font-bold">
                        {t.assessment.age}
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min={10}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gender" className="text-xs font-bold">
                          {t.assessment.biologicalSex}
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowSexExplanation(!showSexExplanation)}
                          className="text-muted-foreground hover:text-primary"
                          title="Explanation"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="male">{t.onboarding.male}</option>
                        <option value="female">{t.onboarding.female}</option>
                        <option value="other">{t.onboarding.other}</option>
                        <option value="prefer_not_to_say">{t.onboarding.preferNotToSay}</option>
                      </select>
                    </div>
                  </div>

                  {/* Biological sex reason explanation expandable pill */}
                  {showSexExplanation && (
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-[11px] text-sky-900 dark:text-sky-200 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Info className="h-4 w-4 text-sky-500 shrink-0" />
                        <span>{t.assessment.whySexNeeded}</span>
                      </div>
                      <p>{t.assessment.whySexExplanation}</p>
                    </div>
                  )}

                  {/* Height Input (Metric vs Imperial) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{unit === "metric" ? t.assessment.heightCm : t.assessment.heightFtIn}</span>
                    </Label>

                    {unit === "metric" ? (
                      <div className="relative">
                        <Input
                          type="number"
                          min={50}
                          max={300}
                          step="0.5"
                          value={heightCm}
                          onChange={(e) => handleCmChange(parseFloat(e.target.value) || 0)}
                          className="rounded-xl text-xs pe-10"
                          placeholder="e.g. 175"
                          required
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                          cm
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            max={8}
                            value={heightFeet}
                            onChange={(e) =>
                              handleFtInChange(
                                parseInt(e.target.value) || 0,
                                typeof heightInches === "number" ? heightInches : 0
                              )
                            }
                            className="rounded-xl text-xs pe-10"
                            placeholder="Feet"
                            required
                          />
                          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                            ft
                          </span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={11}
                            value={heightInches}
                            onChange={(e) =>
                              handleFtInChange(
                                typeof heightFeet === "number" ? heightFeet : 0,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="rounded-xl text-xs pe-10"
                            placeholder="Inches"
                            required
                          />
                          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                            in
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight Input (Metric vs Imperial) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{unit === "metric" ? t.assessment.weightKg : t.assessment.weightLbs}</span>
                    </Label>

                    {unit === "metric" ? (
                      <div className="relative">
                        <Input
                          type="number"
                          min={20}
                          max={500}
                          step="0.1"
                          value={weightKg}
                          onChange={(e) => handleKgChange(parseFloat(e.target.value) || 0)}
                          className="rounded-xl text-xs pe-10"
                          placeholder="e.g. 70"
                          required
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                          kg
                        </span>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          type="number"
                          min={44}
                          max={1100}
                          step="0.5"
                          value={weightLbs}
                          onChange={(e) => handleLbsChange(parseFloat(e.target.value) || 0)}
                          className="rounded-xl text-xs pe-10"
                          placeholder="e.g. 154"
                          required
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold pointer-events-none">
                          lbs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-1.5">
                    <Label htmlFor="activityLevel" className="text-xs font-bold">
                      {t.assessment.activityLevel}
                    </Label>
                    <select
                      id="activityLevel"
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {ACTIVITY_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {t.activityLevels[lvl] || lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Fitness Goal */}
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryGoal" className="text-xs font-bold">
                      {t.assessment.primaryGoal}
                    </Label>
                    <select
                      id="primaryGoal"
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {FITNESS_GOALS.map((g) => (
                        <option key={g} value={g}>
                          {t.goals[g] || g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fitness Experience */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fitnessExperience" className="text-xs font-bold">
                      {t.assessment.fitnessExperience}
                    </Label>
                    <select
                      id="fitnessExperience"
                      value={fitnessExperience}
                      onChange={(e) => setFitnessExperience(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {FITNESS_EXPERIENCES.map((exp) => (
                        <option key={exp} value={exp}>
                          {t.experiences[exp] || exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={calculating}
                    variant="gradient"
                    className="w-full text-xs font-bold py-2.5 rounded-xl shadow-md gap-2"
                  >
                    {calculating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t.assessment.calculating}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>{t.assessment.calculateButton}</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Navigation to Goals */}
            <Card className="rounded-3xl border-border/80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Next Step: Fitness Goals
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Establish safe weight targets and track weekly pacing based on these calculations.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/goals")}
                  className="rounded-xl text-xs font-bold gap-1.5 shrink-0"
                >
                  <span>Set Goal</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Biometric Results & Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {currentAssessment ? (
              <>
                {/* 1. BMI Card */}
                <Card className="rounded-2xl sm:rounded-3xl border-border/80 shadow-md overflow-hidden">
                  <CardHeader className="bg-muted/30 p-3.5 sm:p-5 pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{t.assessment.bmiTitle}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        WHO Adult Standard
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-4 sm:pt-5">
                    <BmiIndicator
                      bmi={currentAssessment.bmi}
                      category={currentAssessment.bmiCategory}
                      isMinor={currentAssessment.isMinor}
                      explanation={calculationNotes.bmiExplanation}
                      disclaimer={calculationNotes.bmiDisclaimer || t.assessment.bmiDisclaimer}
                    />
                  </CardContent>
                </Card>

                {/* 2. BMR & TDEE Large Numbers Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* BMR Card */}
                  <Card className="rounded-2xl sm:rounded-3xl border-border/80 shadow-sm p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        {t.assessment.bmrTitle}
                      </span>
                      <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-4xl font-black text-foreground truncate">
                          {currentAssessment.bmr.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">kcal / day</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {t.assessment.bmrExplanation}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/40 p-2 text-[10px] text-muted-foreground font-mono break-all">
                      {calculationNotes.formulaExplanation || "Mifflin-St Jeor: 10×W + 6.25×H - 5×A ± S"}
                    </div>
                  </Card>

                  {/* TDEE Card */}
                  <Card className="rounded-2xl sm:rounded-3xl border-border/80 shadow-sm p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        {t.assessment.tdeeTitle}
                      </span>
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Flame className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-4xl font-black text-foreground truncate">
                          {currentAssessment.tdee.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">kcal / day</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {t.assessment.tdeeExplanation}
                      </span>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                      Multiplier: {currentAssessment.activityLevel.replace(/_/g, " ")}
                    </div>
                  </Card>
                </div>

                {/* 3. Nutrition Targets Card */}
                <Card className="rounded-2xl sm:rounded-3xl border-border/80 shadow-md overflow-hidden">
                  <CardHeader className="bg-muted/30 p-3.5 sm:p-5 pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{t.assessment.nutritionTitle}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        Target: {currentAssessment.primaryGoal.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-4 sm:pt-5">
                    <MacroBreakdown
                      dailyCalories={currentAssessment.targetCalories}
                      protein={{
                        grams: currentAssessment.targetProteinGrams,
                        calories: currentAssessment.targetProteinGrams * 4,
                        percentage: macroPcts.protein,
                      }}
                      carbs={{
                        grams: currentAssessment.targetCarbsGrams,
                        calories: currentAssessment.targetCarbsGrams * 4,
                        percentage: macroPcts.carbs,
                      }}
                      fat={{
                        grams: currentAssessment.targetFatGrams,
                        calories: currentAssessment.targetFatGrams * 9,
                        percentage: macroPcts.fat,
                      }}
                      disclaimer={t.assessment.nutritionDisclaimer}
                      isRestrictedFloor={currentAssessment.hasHealthWarning}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Empty state if user hasn't calculated assessment yet */
              <Card className="rounded-3xl border-border/80 p-12 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Calculator className="h-8 w-8" />
                </div>
                <h3 className="text-base font-extrabold">{t.dashboard.noAssessmentData}</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Provide your age, height, weight, and activity level on the left and submit to view your BMI indicator, BMR, TDEE, and daily macro targets.
                </p>
              </Card>
            )}

            {/* 4. Past Assessments History Log */}
            {history.length > 0 && (
              <Card className="rounded-3xl border-border/80 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <span>{t.assessment.historyTitle}</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">{history.length} snapshots</span>
                </div>

                <div className="divide-y divide-border/60">
                  {history.slice(0, 5).map((item) => (
                    <div key={item.id} className="py-3 flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2 text-xs">
                      <div>
                        <div className="font-bold text-foreground">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {item.weight} kg &bull; BMI: {item.bmi} ({item.bmiCategory})
                        </span>
                      </div>
                      <div className="text-start xs:text-end">
                        <span className="font-extrabold text-foreground">
                          {item.targetCalories} kcal
                        </span>
                        <span className="text-[10px] text-muted-foreground block capitalize">
                          {item.primaryGoal.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

