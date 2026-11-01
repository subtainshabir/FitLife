"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import {
  Sparkles,
  Utensils,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  ChevronRight,
  Clock,
  Flame,
  Scale,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Layers,
  HeartPulse,
  Info,
} from "lucide-react";

interface MealFoodItemData {
  id: string;
  foodItemId: string | null;
  nameEn: string;
  nameUr: string;
  quantity: number;
  unit: string;
  weightGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fibreGrams: number;
  costPkr: number;
  priceSource: string | null;
  isVerifiedPrice: boolean;
  notes?: string | null;
}

interface MealData {
  id: string;
  mealType: string;
  nameEn: string;
  nameUr: string;
  prepTimeMinutes: number;
  instructions: string | null;
  targetCalories: number | null;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFibreGrams: number;
  totalCostPkr: number;
  displayOrder: number;
  items: MealFoodItemData[];
}

interface MealPlanDayData {
  id: string;
  dayNumber: number;
  dayName: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFibreGrams: number;
  totalCostPkr: number;
  meals: MealData[];
}

interface GroceryItemData {
  id: string;
  foodItemId: string | null;
  itemNameEn: string;
  itemNameUr: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCostPkr: number;
  isPurchased: boolean;
  priceSource: string | null;
  isVerifiedPrice: boolean;
}

interface GroceryListData {
  id: string;
  name: string;
  daysCovered: number;
  totalEstimatedCostPkr: number;
  items: GroceryItemData[];
}

interface NutritionPlanData {
  id: string;
  name: string;
  goal: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetFibreGrams: number;
  dailyBudget: number;
  budgetPeriod: string;
  currency: string;
  city: string;
  mealsPerDay: number;
  status: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFibreGrams: number;
  totalDailyCostPkr: number;
  isBudgetExceeded: boolean;
  aiNotes: string | null;
  aiModel: string | null;
  createdAt: string;
}

export default function NutritionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, isRtl, language } = useI18n();

  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState<NutritionPlanData[]>([]);
  const [activePlan, setActivePlan] = useState<NutritionPlanData | null>(null);
  const [activeMealPlanDays, setActiveMealPlanDays] = useState<MealPlanDayData[]>([]);
  const [activeGroceryList, setActiveGroceryList] = useState<GroceryListData | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "grocery" | "generator" | "history">("plan");

  // Generator Form State
  const [formData, setFormData] = useState({
    name: "",
    goal: "muscle_building",
    targetCalories: 2200,
    targetProteinGrams: 140,
    targetCarbsGrams: 250,
    targetFatGrams: 65,
    targetFibreGrams: 28,
    dailyBudget: 500,
    city: "Rawalpindi",
    mealsPerDay: 4,
    cookingTimeMinutes: 30,
    dietaryType: "standard",
    excludedFoods: [] as string[],
    allergies: [] as string[],
    useAi: true,
  });

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Substitution Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedSubItem, setSelectedSubItem] = useState<{
    mealId: string;
    item: MealFoodItemData;
  } | null>(null);
  const [subStrategy, setSubStrategy] = useState<"cheaper" | "higher_protein" | "similar_macros">("cheaper");
  const [submittingSub, setSubmittingSub] = useState(false);

  // Recipe Drawer / Modal State
  const [recipeModalMeal, setRecipeModalMeal] = useState<MealData | null>(null);

  // Single Meal Regenerating State
  const [regeneratingMealId, setRegeneratingMealId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/nutrition");
      return;
    }

    if (status === "authenticated") {
      loadInitialData();
    }
  }, [status, router]);

  async function loadInitialData() {
    setLoading(true);
    try {
      // 1. Fetch user's plans list
      const plansRes = await fetch("/api/v1/nutrition-plans");
      if (plansRes.ok) {
        const data = await plansRes.json();
        const plans: NutritionPlanData[] = data.plans || [];
        setPlansList(plans);

        // Find active plan or latest plan
        const currentActive = plans.find((p) => p.status === "active") || plans[0] || null;
        if (currentActive) {
          await loadPlanDetails(currentActive.id);
        } else {
          setActiveTab("generator");
        }
      }

      // 2. Fetch user assessment/goals/profile to pre-fill generator defaults
      const [assessRes, goalsRes, prefRes] = await Promise.all([
        fetch("/api/v1/assessments/latest"),
        fetch("/api/v1/goals"),
        fetch("/api/v1/nutrition-plans/preferences"),
      ]);

      let cityDefault = "Rawalpindi";
      let caloriesDefault = 2200;
      let proteinDefault = 140;
      let carbsDefault = 250;
      let fatDefault = 65;
      let goalDefault = "muscle_building";
      let budgetDefault = 500;
      let mealsDefault = 4;

      if (prefRes.ok) {
        const prefData = await prefRes.json();
        if (prefData.preferences) {
          cityDefault = prefData.preferences.city || cityDefault;
          budgetDefault = prefData.preferences.dailyBudget || budgetDefault;
          mealsDefault = prefData.preferences.mealsPerDay || mealsDefault;
        }
      }

      if (assessRes.ok) {
        const assessData = await assessRes.json();
        const a = assessData.assessment;
        if (a) {
          if (a.targetCalories) caloriesDefault = Math.round(a.targetCalories);
          if (a.targetProteinGrams) proteinDefault = Math.round(a.targetProteinGrams);
          if (a.targetCarbsGrams) carbsDefault = Math.round(a.targetCarbsGrams);
          if (a.targetFatGrams) fatDefault = Math.round(a.targetFatGrams);
        }
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        const g = goalsData.activeGoal;
        if (g && g.goalType) {
          goalDefault = g.goalType;
        }
      }

      setFormData((prev) => ({
        ...prev,
        city: cityDefault,
        dailyBudget: budgetDefault,
        mealsPerDay: mealsDefault,
        targetCalories: caloriesDefault,
        targetProteinGrams: proteinDefault,
        targetCarbsGrams: carbsDefault,
        targetFatGrams: fatDefault,
        goal: goalDefault,
      }));
    } catch (err) {
      console.error("Failed to load nutrition data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlanDetails(planId: string) {
    try {
      const res = await fetch(`/api/v1/nutrition-plans/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setActivePlan(data.plan);
        setActiveMealPlanDays(data.mealPlans || []);
        setActiveGroceryList(data.groceryList || null);
      }
    } catch (err) {
      console.error("Failed to load full plan:", err);
    }
  }

  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/v1/nutrition-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan.");
      }

      setActivePlan(data.plan);
      setActiveMealPlanDays(data.mealPlans || []);
      setActiveGroceryList(data.groceryList || null);
      setPlansList((prev) => [data.plan, ...prev.filter((p) => p.id !== data.plan.id)]);
      setActiveTab("plan");
    } catch (err: any) {
      setGenerateError(err.message || "An unexpected error occurred while generating the plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateMeal(mealId: string, preference: string = "balanced") {
    if (!activePlan) return;
    setRegeneratingMealId(mealId);

    try {
      const res = await fetch(`/api/v1/nutrition-plans/${activePlan.id}/regenerate-meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId, preference }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to regenerate meal");
        return;
      }

      const data = await res.json();
      // Refresh current plan
      await loadPlanDetails(activePlan.id);
    } catch (err) {
      console.error("Regenerate meal error:", err);
    } finally {
      setRegeneratingMealId(null);
    }
  }

  async function handleSubstituteFood() {
    if (!activePlan || !selectedSubItem) return;
    setSubmittingSub(true);

    try {
      const res = await fetch(`/api/v1/nutrition-plans/${activePlan.id}/substitute-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId: selectedSubItem.mealId,
          mealFoodItemId: selectedSubItem.item.id,
          strategy: subStrategy,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to substitute food");
        return;
      }

      setSubModalOpen(false);
      setSelectedSubItem(null);
      await loadPlanDetails(activePlan.id);
    } catch (err) {
      console.error("Food substitution error:", err);
    } finally {
      setSubmittingSub(false);
    }
  }

  async function toggleGroceryPurchased(itemId: string, currentStatus: boolean) {
    if (!activeGroceryList) return;

    // Optimistic UI update
    setActiveGroceryList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, isPurchased: !currentStatus } : i)),
      };
    });

    try {
      await fetch(`/api/v1/grocery-lists/${activeGroceryList.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPurchased: !currentStatus }),
      });
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  }

  const citiesList = [
    "Rawalpindi",
    "Islamabad",
    "Lahore",
    "Karachi",
    "Kotli",
    "Peshawar",
    "Quetta",
    "Multan",
    "Faisalabad",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
      <DashboardNav />

      <main className="flex-1 pb-20 md:pb-12">
        {/* Top Header Banner */}
        <section className="border-b border-border/80 bg-gradient-to-b from-card/80 to-background/40 backdrop-blur-md py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    Phase 4 Feature
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">
                    Grounded in Verified Pakistan Food Rates
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {language === "ur" ? "اے آئی غذائی پلانر اور بجٹ ڈائٹ پلان" : "AI Nutrition Planner & Budget Diet Plans"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Generate culturally tailored Pakistani meal schedules aligned with your fitness goals and daily food budget in PKR.
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border/80 self-start md:self-auto">
                <Button
                  size="sm"
                  variant={activeTab === "plan" ? "default" : "ghost"}
                  onClick={() => setActiveTab("plan")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Utensils className="h-3.5 w-3.5" />
                  <span>Meal Plan</span>
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === "grocery" ? "default" : "ghost"}
                  onClick={() => setActiveTab("grocery")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Grocery List</span>
                  {activeGroceryList && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ms-0.5">
                      {activeGroceryList.items.length}
                    </Badge>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === "generator" ? "default" : "ghost"}
                  onClick={() => setActiveTab("generator")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Plan</span>
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === "history" ? "default" : "ghost"}
                  onClick={() => setActiveTab("history")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Saved Plans</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ms-0.5">
                    {plansList.length}
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Body */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">
                Loading your localized nutrition intelligence...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: ACTIVE MEAL PLAN */}
              {activeTab === "plan" && (
                <div className="space-y-6">
                  {activePlan ? (
                    <>
                      {/* Plan Metric Summary Header Card */}
                      <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Plan Info */}
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                                {activePlan.name}
                              </h2>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                                {activePlan.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] font-semibold gap-1">
                                <MapPin className="h-3 w-3 text-emerald-500" />
                                {activePlan.city}
                              </Badge>
                              {activePlan.aiModel && (
                                <Badge variant="secondary" className="text-[9px] font-semibold">
                                  Engine: {activePlan.aiModel.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                              {activePlan.aiNotes || "Culturally authentic daily nutrition plan tailored to your body and budget."}
                            </p>
                          </div>

                          {/* Budget & Cost Widget */}
                          <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/80">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Daily Budget
                              </span>
                              <span className="text-lg font-black text-foreground">
                                PKR {Math.round(activePlan.dailyBudget)}
                              </span>
                            </div>

                            <div className="h-8 w-px bg-border/80 mx-1" />

                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Estimated Cost
                              </span>
                              <span
                                className={`text-lg font-black ${
                                  activePlan.isBudgetExceeded
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                PKR {Math.round(activePlan.totalDailyCostPkr)}
                              </span>
                            </div>

                            <div className="h-8 w-px bg-border/80 mx-1" />

                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Status
                              </span>
                              {activePlan.isBudgetExceeded ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Over by PKR {Math.round(activePlan.totalDailyCostPkr - activePlan.dailyBudget)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Within Budget
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Macro Summary Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-border/60">
                          {/* Calories */}
                          <div className="bg-muted/30 p-3 rounded-2xl border border-border/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                              <Flame className="h-3 w-3 text-amber-500" />
                              Calories
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black text-foreground">
                                {Math.round(activePlan.totalCalories)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                / {Math.round(activePlan.targetCalories)} kcal
                              </span>
                            </div>
                          </div>

                          {/* Protein */}
                          <div className="bg-muted/30 p-3 rounded-2xl border border-border/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                              <Scale className="h-3 w-3 text-emerald-500" />
                              Protein
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                {Math.round(activePlan.totalProteinGrams)}g
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                / {Math.round(activePlan.targetProteinGrams)}g
                              </span>
                            </div>
                          </div>

                          {/* Carbs */}
                          <div className="bg-muted/30 p-3 rounded-2xl border border-border/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Carbohydrates
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black text-foreground">
                                {Math.round(activePlan.totalCarbsGrams)}g
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                / {Math.round(activePlan.targetCarbsGrams)}g
                              </span>
                            </div>
                          </div>

                          {/* Fat */}
                          <div className="bg-muted/30 p-3 rounded-2xl border border-border/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Healthy Fats
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black text-foreground">
                                {Math.round(activePlan.totalFatGrams)}g
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                / {Math.round(activePlan.targetFatGrams)}g
                              </span>
                            </div>
                          </div>

                          {/* Fibre */}
                          <div className="bg-muted/30 p-3 rounded-2xl border border-border/60 col-span-2 sm:col-span-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Dietary Fibre
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black text-foreground">
                                {Math.round(activePlan.totalFibreGrams)}g
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                / {Math.round(activePlan.targetFibreGrams)}g
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Day Routine & Meals List */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-emerald-500" />
                            <span>Daily Meal Schedule ({activeMealPlanDays[0]?.meals?.length || 4} Meals)</span>
                          </h3>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Day 1 &bull; Standard Routine
                          </span>
                        </div>

                        {activeMealPlanDays[0]?.meals?.map((meal, idx) => (
                          <Card
                            key={meal.id}
                            className="rounded-3xl border border-border/80 bg-card overflow-hidden transition-all hover:border-emerald-500/40 shadow-sm"
                          >
                            <div className="p-4 sm:p-5">
                              {/* Meal Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                      {meal.mealType.replace(/_/g, " ")}
                                    </Badge>
                                    <h4 className="text-base font-extrabold text-foreground">
                                      {meal.nameEn}
                                    </h4>
                                  </div>
                                  <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 font-urdu" dir="rtl">
                                    {meal.nameUr}
                                  </p>
                                </div>

                                {/* Quick actions & Time */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    {meal.prepTimeMinutes} mins
                                  </span>

                                  {meal.instructions && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setRecipeModalMeal(meal)}
                                      className="h-7 text-xs font-bold rounded-xl gap-1"
                                    >
                                      <BookOpen className="h-3 w-3 text-emerald-500" />
                                      <span>Recipe</span>
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={regeneratingMealId === meal.id}
                                    onClick={() => handleRegenerateMeal(meal.id, "balanced")}
                                    className="h-7 text-xs font-bold text-muted-foreground hover:text-emerald-500 rounded-xl gap-1"
                                    title="Regenerate this single meal"
                                  >
                                    <RefreshCw
                                      className={`h-3 w-3 ${
                                        regeneratingMealId === meal.id ? "animate-spin text-emerald-500" : ""
                                      }`}
                                    />
                                    <span>Regen</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Ingredients Table */}
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-start text-xs">
                                  <thead>
                                    <tr className="border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground text-start">
                                      <th className="py-2 pe-3 text-start">Ingredient</th>
                                      <th className="py-2 px-3 text-start">Quantity</th>
                                      <th className="py-2 px-3 text-start">Calories</th>
                                      <th className="py-2 px-3 text-start">Protein</th>
                                      <th className="py-2 px-3 text-start">Cost (PKR)</th>
                                      <th className="py-2 ps-3 text-end">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {meal.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-2.5 pe-3 font-semibold text-foreground">
                                          <div>{item.nameEn}</div>
                                          <div className="text-[10px] text-muted-foreground font-urdu" dir="rtl">
                                            {item.nameUr}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                                          {item.quantity} {item.unit} ({Math.round(item.weightGrams)}g)
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-foreground">
                                          {Math.round(item.calories)} kcal
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                          {Math.round(item.proteinGrams * 10) / 10}g
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                          <div className="flex items-center gap-1 font-bold text-foreground">
                                            <span>Rs. {Math.round(item.costPkr)}</span>
                                            {item.isVerifiedPrice && (
                                              <span title="Verified Local Market Price">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                              </span>
                                            )}
                                          </div>
                                          {item.priceSource && (
                                            <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                                              {item.priceSource}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2.5 ps-3 text-end">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedSubItem({ mealId: meal.id, item });
                                              setSubModalOpen(true);
                                            }}
                                            className="h-6 text-[10px] font-bold rounded-lg px-2 gap-1"
                                          >
                                            <ArrowRightLeft className="h-2.5 w-2.5 text-emerald-500" />
                                            <span>Swap</span>
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Meal Totals Footer */}
                              <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-4 text-muted-foreground font-semibold">
                                  <span>
                                    Total Calories:{" "}
                                    <strong className="text-foreground">{Math.round(meal.totalCalories)} kcal</strong>
                                  </span>
                                  <span>
                                    Total Protein:{" "}
                                    <strong className="text-emerald-600 dark:text-emerald-400">
                                      {Math.round(meal.totalProteinGrams)}g
                                    </strong>
                                  </span>
                                  <span>
                                    Carbs:{" "}
                                    <strong className="text-foreground">{Math.round(meal.totalCarbsGrams)}g</strong>
                                  </span>
                                  <span>
                                    Fat:{" "}
                                    <strong className="text-foreground">{Math.round(meal.totalFatGrams)}g</strong>
                                  </span>
                                </div>
                                <div className="text-xs font-black text-foreground">
                                  Meal Cost:{" "}
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    PKR {Math.round(meal.totalCostPkr)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Card className="rounded-3xl border border-border/80 bg-card p-12 text-center">
                      <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        No Active Nutrition Plan Found
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
                        Create your first AI-personalized Pakistani meal plan tailored to your daily calorie target and local budget.
                      </p>
                      <Button
                        variant="gradient"
                        onClick={() => setActiveTab("generator")}
                        className="rounded-2xl font-bold text-xs px-6"
                      >
                        <Plus className="h-4 w-4 me-1.5" />
                        Create New Nutrition Plan
                      </Button>
                    </Card>
                  )}
                </div>
              )}

              {/* TAB 2: SMART GROCERY SHOPPING LIST */}
              {activeTab === "grocery" && (
                <div className="space-y-6">
                  {activeGroceryList ? (
                    <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-foreground">
                              {activeGroceryList.name}
                            </h2>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {activeGroceryList.daysCovered} Days Covered
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Consolidated, deduplicated shopping list with verified local retail rates.
                          </p>
                        </div>

                        {/* Total Bill Pill & Actions */}
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              Estimated Bill
                            </span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                              PKR {Math.round(activeGroceryList.totalEstimatedCostPkr)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const text = activeGroceryList.items
                                .map(
                                  (i) =>
                                    `[${i.isPurchased ? "X" : " "}] ${i.itemNameEn} (${i.totalQuantity} ${i.unit}) - PKR ${Math.round(i.estimatedCostPkr)}`
                                )
                                .join("\n");
                              navigator.clipboard.writeText(
                                `${activeGroceryList.name}\nTotal: PKR ${Math.round(
                                  activeGroceryList.totalEstimatedCostPkr
                                )}\n\n${text}`
                              );
                              alert("Grocery list copied to clipboard!");
                            }}
                            className="h-9 rounded-xl text-xs font-bold gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Copy</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.print()}
                            className="h-9 rounded-xl text-xs font-bold gap-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Print</span>
                          </Button>
                        </div>
                      </div>

                      {/* Item Categories */}
                      {["protein", "carbohydrates", "fruits", "vegetables", "healthy_fats", "other"].map(
                        (cat) => {
                          const catItems = activeGroceryList.items.filter(
                            (i) => i.category.toLowerCase() === cat || (cat === "other" && !["protein", "carbohydrates", "fruits", "vegetables", "healthy_fats"].includes(i.category.toLowerCase()))
                          );
                          if (catItems.length === 0) return null;

                          return (
                            <div key={cat} className="mt-6">
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                                <span>{cat.replace(/_/g, " ")} ({catItems.length})</span>
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {catItems.map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={() => toggleGroceryPurchased(item.id, item.isPurchased)}
                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                      item.isPurchased
                                        ? "bg-muted/20 border-border/40 opacity-60"
                                        : "bg-muted/40 border-border/70 hover:border-emerald-500/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors ${
                                          item.isPurchased
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-border bg-card"
                                        }`}
                                      >
                                        {item.isPurchased && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      </div>
                                      <div>
                                        <span
                                          className={`text-xs font-bold block ${
                                            item.isPurchased ? "line-through text-muted-foreground" : "text-foreground"
                                          }`}
                                        >
                                          {item.itemNameEn}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-urdu" dir="rtl">
                                          {item.itemNameUr}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-end">
                                      <span className="text-xs font-extrabold text-foreground block">
                                        {item.totalQuantity} {item.unit}
                                      </span>
                                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        Rs. {Math.round(item.estimatedCostPkr)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </Card>
                  ) : (
                    <Card className="rounded-3xl border border-border/80 bg-card p-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        No Grocery List Available
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
                        Generate a meal plan to instantly generate an itemized 7-day grocery checklist.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* TAB 3: GENERATOR WIZARD FORM */}
              {activeTab === "generator" && (
                <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-8 max-w-4xl mx-auto shadow-sm">
                  <div className="border-b border-border/60 pb-5 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                      <h2 className="text-xl font-black text-foreground">
                        Configure Your Personalized Nutrition Plan
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set your daily budget, target macros, and preparation preferences. FitLife AI will formulate an authentic Pakistani daily schedule with verified local pricing.
                    </p>
                  </div>

                  {generateError && (
                    <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{generateError}</span>
                    </div>
                  )}

                  <form onSubmit={handleGeneratePlan} className="space-y-6">
                    {/* Plan Name & Goal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planName" className="text-xs font-bold text-foreground mb-1 block">
                          Plan Name (Optional)
                        </Label>
                        <Input
                          id="planName"
                          placeholder="e.g. Budget High-Protein Plan"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>

                      <div>
                        <Label htmlFor="goal" className="text-xs font-bold text-foreground mb-1 block">
                          Fitness Goal
                        </Label>
                        <select
                          id="goal"
                          value={formData.goal}
                          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="muscle_building">Muscle Building / Hypertrophy</option>
                          <option value="weight_loss">Weight Loss / Fat Reduction</option>
                          <option value="healthy_weight_gain">Healthy Weight Gain</option>
                          <option value="weight_maintenance">Weight Maintenance</option>
                          <option value="general_fitness">General Health & Fitness</option>
                        </select>
                      </div>
                    </div>

                    {/* Budget & City (Core Phase 4 features) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/60">
                      <div>
                        <Label htmlFor="dailyBudget" className="text-xs font-bold text-foreground mb-1 block">
                          Daily Budget (PKR)
                        </Label>
                        <Input
                          id="dailyBudget"
                          type="number"
                          min={100}
                          max={20000}
                          value={formData.dailyBudget}
                          onChange={(e) =>
                            setFormData({ ...formData, dailyBudget: parseFloat(e.target.value) || 0 })
                          }
                          className="rounded-xl text-xs h-10 font-bold"
                          required
                        />
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          e.g. Rs. 400 - Rs. 800/day
                        </span>
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-xs font-bold text-foreground mb-1 block">
                          City / Market Location
                        </Label>
                        <select
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {citiesList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          Loads official DC rate lists
                        </span>
                      </div>

                      <div>
                        <Label htmlFor="mealsPerDay" className="text-xs font-bold text-foreground mb-1 block">
                          Meals Per Day
                        </Label>
                        <select
                          id="mealsPerDay"
                          value={formData.mealsPerDay}
                          onChange={(e) =>
                            setFormData({ ...formData, mealsPerDay: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value={3}>3 Meals (Breakfast, Lunch, Dinner)</option>
                          <option value={4}>4 Meals (Breakfast, Lunch, Snack, Dinner)</option>
                          <option value={5}>5 Meals (Breakfast, 2 Snacks, Lunch, Dinner)</option>
                          <option value={6}>6 Meals (Athletic 6-meal frequency)</option>
                        </select>
                      </div>
                    </div>

                    {/* Macro Targets */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground block">
                        Daily Target Macros (Pre-filled from your calibrated profile)
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Calories (kcal)
                          </span>
                          <Input
                            type="number"
                            value={formData.targetCalories}
                            onChange={(e) =>
                              setFormData({ ...formData, targetCalories: parseFloat(e.target.value) || 0 })
                            }
                            className="rounded-xl text-xs h-9 font-bold"
                            required
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Protein (g)
                          </span>
                          <Input
                            type="number"
                            value={formData.targetProteinGrams}
                            onChange={(e) =>
                              setFormData({ ...formData, targetProteinGrams: parseFloat(e.target.value) || 0 })
                            }
                            className="rounded-xl text-xs h-9 font-bold text-emerald-600 dark:text-emerald-400"
                            required
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Carbohydrates (g)
                          </span>
                          <Input
                            type="number"
                            value={formData.targetCarbsGrams}
                            onChange={(e) =>
                              setFormData({ ...formData, targetCarbsGrams: parseFloat(e.target.value) || 0 })
                            }
                            className="rounded-xl text-xs h-9 font-bold"
                            required
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Fats (g)
                          </span>
                          <Input
                            type="number"
                            value={formData.targetFatGrams}
                            onChange={(e) =>
                              setFormData({ ...formData, targetFatGrams: parseFloat(e.target.value) || 0 })
                            }
                            className="rounded-xl text-xs h-9 font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dietary Type & Cooking Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dietaryType" className="text-xs font-bold text-foreground mb-1 block">
                          Dietary Style
                        </Label>
                        <select
                          id="dietaryType"
                          value={formData.dietaryType}
                          onChange={(e) => setFormData({ ...formData, dietaryType: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="standard">Standard Pakistani Halal</option>
                          <option value="high_protein">High-Protein Focused</option>
                          <option value="vegetarian">Pakistani Vegetarian (Sabzi & Daal)</option>
                          <option value="low_carb">Low-Carb Pakistani</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="cookingTime" className="text-xs font-bold text-foreground mb-1 block">
                          Max Cooking Time
                        </Label>
                        <select
                          id="cookingTime"
                          value={formData.cookingTimeMinutes}
                          onChange={(e) =>
                            setFormData({ ...formData, cookingTimeMinutes: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value={15}>Quick Prep (under 15 mins)</option>
                          <option value={30}>Moderate (under 30 mins)</option>
                          <option value={45}>Standard Cooking (under 45 mins)</option>
                          <option value={60}>Full Cooking (under 60 mins)</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Engine Selection */}
                    <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">
                          Use Groq AI (LLaMA-3.3-70B)
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Leverage AI reasoning grounded strictly in the local Pakistani food and price database.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.useAi}
                        onChange={(e) => setFormData({ ...formData, useAi: e.target.checked })}
                        className="h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={generating}
                      variant="gradient"
                      className="w-full h-12 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/25"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                          <span>Generating Culturally Optimized Nutrition Plan...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 me-2" />
                          <span>Generate Nutrition Plan</span>
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              )}

              {/* TAB 4: SAVED PLANS HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-foreground">Saved Nutrition Plans</h2>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {plansList.length} Plans Found
                    </span>
                  </div>

                  {plansList.length === 0 ? (
                    <Card className="rounded-3xl border border-border/80 bg-card p-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-xs text-muted-foreground">No saved plans yet.</p>
                    </Card>
                  ) : (
                    plansList.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all hover:border-emerald-500/50 ${
                          activePlan?.id === plan.id
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border/80 bg-card"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-foreground">
                                {plan.name}
                              </h3>
                              <Badge
                                variant={plan.status === "active" ? "default" : "secondary"}
                                className="text-[9px] uppercase font-bold"
                              >
                                {plan.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>City: {plan.city}</span>
                              <span>&bull;</span>
                              <span>Target: {Math.round(plan.targetCalories)} kcal</span>
                              <span>&bull;</span>
                              <span>Cost: PKR {Math.round(plan.totalDailyCostPkr)}/day</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={activePlan?.id === plan.id ? "default" : "outline"}
                              onClick={async () => {
                                await loadPlanDetails(plan.id);
                                setActiveTab("plan");
                              }}
                              className="rounded-xl text-xs font-bold"
                            >
                              {activePlan?.id === plan.id ? "Viewing" : "View Plan"}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this nutrition plan?")) {
                                  await fetch(`/api/v1/nutrition-plans/${plan.id}`, {
                                    method: "DELETE",
                                  });
                                  setPlansList((prev) => prev.filter((p) => p.id !== plan.id));
                                  if (activePlan?.id === plan.id) {
                                    setActivePlan(null);
                                  }
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* FOOD SUBSTITUTION MODAL */}
      {subModalOpen && selectedSubItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="rounded-3xl border border-border/80 bg-card p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-extrabold text-foreground">
                  Substitute Food Ingredient
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubModalOpen(false)}
                className="h-8 w-8 p-0 rounded-xl"
              >
                &times;
              </Button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Current Ingredient
                </span>
                <span className="text-sm font-extrabold text-foreground block">
                  {selectedSubItem.item.nameEn} ({selectedSubItem.item.nameUr})
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{selectedSubItem.item.quantity} {selectedSubItem.item.unit}</span>
                  <span>&bull;</span>
                  <span>{Math.round(selectedSubItem.item.calories)} kcal</span>
                  <span>&bull;</span>
                  <span>Rs. {Math.round(selectedSubItem.item.costPkr)}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">
                  Substitution Strategy
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={subStrategy === "cheaper" ? "default" : "outline"}
                    onClick={() => setSubStrategy("cheaper")}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    Save Money
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={subStrategy === "higher_protein" ? "default" : "outline"}
                    onClick={() => setSubStrategy("higher_protein")}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    High Protein
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={subStrategy === "similar_macros" ? "default" : "outline"}
                    onClick={() => setSubStrategy("similar_macros")}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    Similar Macros
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  FitLife AI will locate verified local Pakistani alternatives (e.g. Daal Chana, Farm Eggs, or Roti) to optimize your targets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                disabled={submittingSub}
                onClick={handleSubstituteFood}
                className="rounded-xl text-xs font-bold"
              >
                {submittingSub ? "Swapping..." : "Confirm Swap"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* RECIPE INSTRUCTIONS MODAL */}
      {recipeModalMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="rounded-3xl border border-border/80 bg-card p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  {recipeModalMeal.nameEn}
                </h3>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-urdu" dir="rtl">
                  {recipeModalMeal.nameUr}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecipeModalMeal(null)}
                className="h-8 w-8 p-0 rounded-xl"
              >
                &times;
              </Button>
            </div>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
                  Preparation & Cooking Steps
                </span>
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/30 p-4 rounded-2xl border border-border/60">
                  {recipeModalMeal.instructions}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
                  Ingredients for This Meal
                </span>
                <div className="space-y-1.5">
                  {recipeModalMeal.items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-muted/20"
                    >
                      <span className="font-semibold text-foreground">{i.nameEn}</span>
                      <span className="text-muted-foreground">
                        {i.quantity} {i.unit} ({Math.round(i.calories)} kcal)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/60">
              <Button
                variant="default"
                size="sm"
                onClick={() => setRecipeModalMeal(null)}
                className="rounded-xl text-xs font-bold"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}

