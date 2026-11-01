"use client";

import React, { useEffect, useState } from "react";
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
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Globe,
  Languages,
  MapPin,
  DollarSign,
  Scale,
  Ruler,
  Shield,
  Activity,
  Award,
} from "lucide-react";
import { FITNESS_GOALS, ACTIVITY_LEVELS, FITNESS_EXPERIENCES } from "@/lib/validations/profile";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { t, setLanguage } = useI18n();

  const [activeTab, setActiveTab] = useState<"personal" | "fitness" | "lifestyle">("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "ur">("en");

  const [fitnessGoal, setFitnessGoal] = useState("");
  const [fitnessExperience, setFitnessExperience] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/users/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setName(data.user.name || "");
            setEmail(data.user.email || "");
            setCreatedAt(data.user.createdAt || null);
          }
          if (data.profile) {
            const p = data.profile;
            setDateOfBirth(p.dateOfBirth || "");
            setGender(p.gender || "prefer_not_to_say");
            setHeight(p.height ? p.height.toString() : "");
            setCurrentWeight(p.currentWeight ? p.currentWeight.toString() : "");
            setCountry(p.country || "");
            setCity(p.city || "");
            setPreferredCurrency(p.preferredCurrency || "USD");
            if (p.preferredLanguage) {
              setPreferredLanguage(p.preferredLanguage);
            }
            setFitnessGoal(p.fitnessGoal || "general_fitness");
            setFitnessExperience(p.fitnessExperience || "beginner");
            setActivityLevel(p.activityLevel || "moderately_active");
            setAvailableEquipment(p.availableEquipment || []);
            setDietaryPreferences(p.dietaryPreferences || []);
            setAllergies(p.allergies || []);
            setDietaryRestrictions(p.dietaryRestrictions || []);
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const h = height ? parseFloat(height) : undefined;
      const w = currentWeight ? parseFloat(currentWeight) : undefined;

      const payload = {
        name,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        height: h,
        currentWeight: w,
        country: country || undefined,
        city: city || undefined,
        preferredCurrency,
        preferredLanguage,
        fitnessGoal: fitnessGoal || undefined,
        fitnessExperience: fitnessExperience || undefined,
        activityLevel: activityLevel || undefined,
        availableEquipment,
        dietaryPreferences,
        allergies,
        dietaryRestrictions,
      };

      const res = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        setSaving(false);
        return;
      }

      setSuccess(t.profile.updateSuccess);

      if (preferredLanguage) {
        setLanguage(preferredLanguage);
      }

      if (updateSession) {
        await updateSession();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while saving changes.");
    } finally {
      setSaving(false);
    }
  };

  const equipmentOptions = [
    { id: "bodyweight", label: "Bodyweight" },
    { id: "dumbbells", label: "Dumbbells" },
    { id: "barbells", label: "Barbells" },
    { id: "resistance_bands", label: "Resistance Bands" },
    { id: "kettlebells", label: "Kettlebells" },
    { id: "pull_up_bar", label: "Pull-Up Bar" },
    { id: "full_gym", label: "Full Commercial Gym" },
  ];

  const dietOptions = [
    { id: "standard", label: "Standard Balanced" },
    { id: "high_protein", label: "High Protein" },
    { id: "low_carb", label: "Low Carb" },
    { id: "keto", label: "Ketogenic" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0 selection:bg-primary selection:text-primary-foreground">
      <DashboardNav />

      <main className="flex-1 container px-4 sm:px-8 py-8 max-w-4xl mx-auto space-y-6">
        {/* Header Profile Badge */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-emerald-500/25">
              {name ? name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground">
                  {name || "Athlete"}
                </h1>
                <Badge variant="success" className="text-[10px]">
                  Verified Profile
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {email} &bull; Member since {createdAt ? new Date(createdAt).getFullYear() : "2026"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="text-[11px] font-bold">
              PostgreSQL 16 &bull; Drizzle ORM
            </Badge>
          </div>
        </div>

        {/* Visual Tab Bar with Icons */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/30 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "personal"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            <span>{t.profile.personalTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fitness")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "fitness"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Target className="h-4 w-4" />
            <span>{t.profile.fitnessTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lifestyle")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "lifestyle"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>{t.profile.lifestyleTab}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave}>
          <Card className="border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden">
            {success && (
              <div className="m-6 mb-0 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="m-6 mb-0 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* TAB 1: Personal Attributes */}
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-bold text-foreground">
                        {t.auth.fullName}
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/20"
                        placeholder="Alex Morgan"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-bold text-foreground">
                        {t.auth.email} (Permanent)
                      </Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="h-11 rounded-xl text-xs opacity-60 bg-muted/40 cursor-not-allowed"
                      />
                    </div>

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
                        className="h-11 rounded-xl text-xs bg-muted/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="gender" className="text-xs font-bold text-foreground">
                        {t.onboarding.gender}
                      </Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs font-bold"
                      >
                        <option value="male">{t.onboarding.male}</option>
                        <option value="female">{t.onboarding.female}</option>
                        <option value="non_binary">{t.onboarding.other}</option>
                        <option value="prefer_not_to_say">{t.onboarding.preferNotToSay}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="height" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.height}</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="height"
                          type="number"
                          min="50"
                          max="300"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="h-11 rounded-xl text-xs bg-muted/20 pe-12 font-bold"
                          placeholder="175"
                        />
                        <span className="absolute end-3 top-3 text-xs font-bold text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="weight" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.weight}</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="weight"
                          type="number"
                          min="20"
                          max="500"
                          value={currentWeight}
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          className="h-11 rounded-xl text-xs bg-muted/20 pe-12 font-bold"
                          placeholder="70"
                        />
                        <span className="absolute end-3 top-3 text-xs font-bold text-muted-foreground">
                          kg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="country" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.country}</span>
                      </Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/20"
                        placeholder="Pakistan"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs font-bold text-foreground">
                        {t.onboarding.city}
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 rounded-xl text-xs bg-muted/20"
                        placeholder="Lahore"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="currency" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.onboarding.currency}</span>
                      </Label>
                      <select
                        id="currency"
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs font-bold"
                      >
                        <option value="PKR">PKR (₨) - Pakistan</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                        <option value="SAR">SAR (﷼) - Saudi Riyal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="language" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.common.language}</span>
                      </Label>
                      <select
                        id="language"
                        value={preferredLanguage}
                        onChange={(e) => {
                          const lang = e.target.value as "en" | "ur";
                          setPreferredLanguage(lang);
                        }}
                        className="h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs font-bold"
                      >
                        <option value="en">English</option>
                        <option value="ur">اردو (Urdu)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Fitness & Training */}
              {activeTab === "fitness" && (
                <div className="space-y-6">
                  {/* Fitness Goals */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.fitnessGoal}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {FITNESS_GOALS.map((g) => {
                        const isSelected = fitnessGoal === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFitnessGoal(g)}
                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <span>{t.goals[g] || g}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Experience */}
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
                            className={`p-3 rounded-2xl border text-center text-xs font-bold capitalize transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {t.experiences[exp] || exp}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.activityLevel}
                    </Label>
                    <div className="space-y-2">
                      {ACTIVITY_LEVELS.map((act) => {
                        const isSelected = activityLevel === act;
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setActivityLevel(act)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-start text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/30"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <span>{t.activityLevels[act] || act}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Equipment */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.availableEquipment}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {equipmentOptions.map((eq) => {
                        const isSelected = availableEquipment.includes(eq.id);
                        return (
                          <button
                            key={eq.id}
                            type="button"
                            onClick={() => toggleArrayItem(availableEquipment, setAvailableEquipment, eq.id)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {eq.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Nutrition & Diet */}
              {activeTab === "lifestyle" && (
                <div className="space-y-6">
                  {/* Dietary Preferences */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {t.onboarding.dietaryPreferences}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {dietOptions.map((diet) => {
                        const isSelected = dietaryPreferences.includes(diet.id);
                        return (
                          <button
                            key={diet.id}
                            type="button"
                            onClick={() => toggleArrayItem(dietaryPreferences, setDietaryPreferences, diet.id)}
                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {diet.label}
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
                            onClick={() => toggleArrayItem(dietaryRestrictions, setDietaryRestrictions, res.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
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
                                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40"
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

            <CardFooter className="flex items-center justify-end border-t border-border/60 p-4 sm:px-8 bg-muted/10">
              <Button
                type="submit"
                variant="gradient"
                disabled={saving}
                className="gap-2 text-xs font-extrabold px-6 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.common.saving}</span>
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t.profile.saveChanges}</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>

      <Footer />
    </div>
  );
}
