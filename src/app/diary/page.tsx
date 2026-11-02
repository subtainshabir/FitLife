"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Droplet,
  Utensils,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Flame,
  Award,
  Star,
  RefreshCw,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

export default function DailyFoodDiaryPage() {
  const { language } = useI18n();
  const isUr = language === "ur";

  // Date State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Data States
  const [summary, setSummary] = useState<any | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [quickFoods, setQuickFoods] = useState<any | null>(null);
  const [catalogFoods, setCatalogFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeMealCategory, setActiveMealCategory] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("breakfast");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeMealPlan, setActiveMealPlan] = useState<any | null>(null);
  const [selectedImportItems, setSelectedImportItems] = useState<string[]>([]);
  const [waterGoalModalOpen, setWaterGoalModalOpen] = useState(false);
  const [customWaterGoal, setCustomWaterGoal] = useState(2500);

  // Search & Logging State
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState("all");
  const [loggingQuantity, setLoggingQuantity] = useState(1);
  const [loggingUnit, setLoggingUnit] = useState("piece");
  const [selectedCatalogFood, setSelectedCatalogFood] = useState<any | null>(null);
  const [searchTab, setSearchTab] = useState<"search" | "favourites" | "recent">("search");
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Load Daily Summary & Insights
  useEffect(() => {
    async function loadDailyData() {
      try {
        setLoading(true);

        const [sumRes, insRes, quickRes, catRes] = await Promise.all([
          fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`),
          fetch(`/api/v1/nutrition/insights?date=${selectedDate}`),
          fetch("/api/v1/nutrition/quick-foods"),
          fetch("/api/v1/foods?limit=100"),
        ]);

        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          setSummary(sumJson.data);
          if (sumJson.data?.water?.targetMl) {
            setCustomWaterGoal(sumJson.data.water.targetMl);
          }
        }

        if (insRes.ok) {
          const insJson = await insRes.json();
          setInsights(insJson.data || []);
        }

        if (quickRes.ok) {
          const qJson = await quickRes.json();
          setQuickFoods(qJson.data);
        }

        if (catRes.ok) {
          const cJson = await catRes.json();
          setCatalogFoods(cJson.data?.items || cJson.data || []);
        }
      } catch (err) {
        console.error("Failed to load daily diary data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDailyData();
  }, [selectedDate]);

  // Navigate Date
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  // 2. Log Food Item
  const handleLogFood = async (food: any, category?: string) => {
    try {
      setActionLoading(true);
      const cat = category || activeMealCategory;

      const res = await fetch("/api/v1/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: selectedDate,
          foodItemId: food.id || food.foodItemId,
          mealCategory: cat,
          foodNameEn: food.nameEn || food.foodNameEn,
          foodNameUr: food.nameUr || food.foodNameUr,
          quantity: loggingQuantity || 1,
          unit: loggingUnit || food.defaultServingUnit || "piece",
        }),
      });

      if (res.ok) {
        // Refresh summary
        const sumRes = await fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`);
        if (sumRes.ok) {
          const sJson = await sumRes.json();
          setSummary(sJson.data);
        }
        setSearchModalOpen(false);
        setSelectedCatalogFood(null);
      }
    } catch (err) {
      console.error("Log food error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Delete Food Entry
  const handleDeleteFoodEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/v1/nutrition/logs/${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const sumRes = await fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`);
        if (sumRes.ok) {
          const sJson = await sumRes.json();
          setSummary(sJson.data);
        }
      }
    } catch (err) {
      console.error("Delete entry error:", err);
    }
  };

  // 4. Quick Log Water
  const handleLogWater = async (amountMl: number) => {
    try {
      const res = await fetch("/api/v1/nutrition/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          amountMl,
        }),
      });

      if (res.ok) {
        const sumRes = await fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`);
        if (sumRes.ok) {
          const sJson = await sumRes.json();
          setSummary(sJson.data);
        }
      }
    } catch (err) {
      console.error("Log water error:", err);
    }
  };

  // 5. Update Water Goal
  const handleUpdateWaterGoal = async () => {
    try {
      const res = await fetch("/api/v1/nutrition/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTargetMl: customWaterGoal,
        }),
      });

      if (res.ok) {
        setWaterGoalModalOpen(false);
        const sumRes = await fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`);
        if (sumRes.ok) {
          const sJson = await sumRes.json();
          setSummary(sJson.data);
        }
      }
    } catch (err) {
      console.error("Update water goal error:", err);
    }
  };

  // 6. Open Meal Plan Import Modal
  const handleOpenMealPlanImport = async () => {
    try {
      setImportModalOpen(true);
      // Fetch active nutrition plan
      const res = await fetch("/api/v1/nutrition-plans");
      if (res.ok) {
        const json = await res.json();
        const active = json.data?.find((p: any) => p.status === "active") || json.data?.[0];
        if (active) {
          // Fetch full plan details
          const detailRes = await fetch(`/api/v1/nutrition-plans/${active.id}`);
          if (detailRes.ok) {
            const dJson = await detailRes.json();
            setActiveMealPlan(dJson.data);
            // Pre-select all ingredient IDs
            const allIds: string[] = [];
            dJson.data?.mealPlans?.[0]?.meals?.forEach((m: any) => {
              m.items?.forEach((it: any) => allIds.push(it.id));
            });
            setSelectedImportItems(allIds);
          }
        }
      }
    } catch (err) {
      console.error("Load meal plan error:", err);
    }
  };

  // 7. Execute Import Meal Plan
  const handleConfirmImport = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/nutrition/import-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          nutritionPlanId: activeMealPlan?.id,
          selectedFoodItemIds: selectedImportItems,
          confirmConsumed: true,
        }),
      });

      if (res.ok) {
        setImportModalOpen(false);
        const sumRes = await fetch(`/api/v1/nutrition/daily-summary?date=${selectedDate}`);
        if (sumRes.ok) {
          const sJson = await sumRes.json();
          setSummary(sJson.data);
        }
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Favourite
  const handleToggleFavourite = async (foodId: string) => {
    try {
      const isFav = quickFoods?.favourites?.some((f: any) => f.foodItemId === foodId);
      if (isFav) {
        await fetch(`/api/v1/nutrition/favourites/${foodId}`, { method: "DELETE" });
      } else {
        await fetch("/api/v1/nutrition/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodItemId: foodId }),
        });
      }
      // Refresh quick foods
      const qRes = await fetch("/api/v1/nutrition/quick-foods");
      if (qRes.ok) {
        const qJson = await qRes.json();
        setQuickFoods(qJson.data);
      }
    } catch (err) {
      console.error("Favourite toggle error:", err);
    }
  };

  // Filter Catalog
  const filteredCatalog = catalogFoods.filter((f) => {
    const matchesSearch =
      f.nameEn.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
      f.nameUr?.includes(foodSearchQuery);
    return matchesSearch;
  });

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Utensils className="h-8 w-8 animate-pulse text-emerald-500 mb-2" />
        <p className="text-sm">Loading daily food diary...</p>
      </div>
    );
  }

  const { totals, targets, remaining, percentages, water, mealBreakdown } = summary;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 pb-28">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Date Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Utensils className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {isUr ? "روزانہ خوراک کی ڈائری" : "Daily Food Diary"}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isUr
                ? "کیلوریز اور غذائی اجزاء ٹریک کریں، کھانا درج کریں اور ہدف حاصل کریں"
                : "Log meals, monitor calories & macros, track hydration, and hit your target."}
            </p>
          </div>

          {/* Date Picker Controls */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleShiftDate(-1)}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
              {isToday && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  Today
                </Badge>
              )}
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleShiftDate(1)}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Phase 4 Meal Plan Import Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isUr ? "کھانے کے منصوبے سے امپورٹ کریں" : "Import Today's Planned Meals (Phase 4)"}
              </h3>
              <p className="text-xs text-slate-400">
                {isUr
                  ? "اپنے تیار کردہ کھانے کے پلان کو ڈائری میں ایک کلک سے شامل کریں"
                  : "Sync foods directly from your personalized Pakistani meal plan without duplicate logging."}
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenMealPlanImport}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isUr ? "کھانے امپورٹ کریں" : "Import Meals"}
          </Button>
        </div>

        {/* Visual Nutrition Dashboard (Calorie Ring + Macros) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calorie Card */}
          <Card className="border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isUr ? "کیلوری کا توازن" : "Caloric Balance"}
                </span>
                <Badge
                  className={`text-[10px] ${
                    remaining.calories >= 0
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-950 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {remaining.calories >= 0 ? `${remaining.calories} kcal remaining` : `${Math.abs(remaining.calories)} kcal over`}
                </Badge>
              </div>

              <div className="flex items-center justify-center my-4">
                <div className="relative flex items-center justify-center">
                  <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-emerald-500 transition-all duration-500"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={
                        2 * Math.PI * 50 -
                        (Math.min(percentages.calorie, 100) / 100) * (2 * Math.PI * 50)
                      }
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-mono text-3xl font-black text-white">
                      {totals.calories}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      / {targets.calories} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Consumed</span>
                <p className="font-bold text-white">{totals.calories} kcal</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Target</span>
                <p className="font-bold text-emerald-400">{targets.calories} kcal</p>
              </div>
            </div>
          </Card>

          {/* Macronutrients Breakdown */}
          <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isUr ? "غذائی اجزاء (میکروز)" : "Macronutrient Targets"}
              </span>
              <span className="text-xs text-slate-400">
                {summary.totalLoggedItems} items logged
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Protein */}
              <div className="space-y-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-emerald-400">Protein</span>
                  <span className="font-mono text-slate-300">
                    {totals.protein} / {targets.protein}g ({percentages.protein}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(percentages.protein, 100)}%` }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {remaining.protein > 0 ? `${remaining.protein}g remaining` : "Target achieved"}
                </span>
              </div>

              {/* Carbohydrates */}
              <div className="space-y-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-blue-400">Carbohydrates</span>
                  <span className="font-mono text-slate-300">
                    {totals.carbs} / {targets.carbs}g ({percentages.carbs}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(percentages.carbs, 100)}%` }}
                    className="h-full rounded-full bg-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {remaining.carbs > 0 ? `${remaining.carbs}g remaining` : "Target achieved"}
                </span>
              </div>

              {/* Fat */}
              <div className="space-y-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-amber-400">Fats</span>
                  <span className="font-mono text-slate-300">
                    {totals.fat} / {targets.fat}g ({percentages.fat}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(percentages.fat, 100)}%` }}
                    className="h-full rounded-full bg-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {remaining.fat > 0 ? `${remaining.fat}g remaining` : "Target achieved"}
                </span>
              </div>

              {/* Fibre */}
              <div className="space-y-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-teal-400">Dietary Fibre</span>
                  <span className="font-mono text-slate-300">
                    {totals.fibre} / {targets.fibre}g
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(Math.round((totals.fibre / targets.fibre) * 100), 100)}%`,
                    }}
                    className="h-full rounded-full bg-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Supports healthy digestion
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Water Intake Tracker Widget */}
        <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isUr ? "پانی پینے کا ٹریکر" : "Water Intake Tracker"}
                </h3>
                <span className="text-xs text-slate-400">
                  {water.totalLitres}L / {water.targetLitres}L ({water.percentage}%)
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setWaterGoalModalOpen(true)}
              className="border-slate-700 bg-slate-800 text-xs text-slate-300 h-8"
            >
              Goal: {water.targetMl} ml
            </Button>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden">
            <div
              style={{ width: `${Math.min(water.percentage, 100)}%` }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
            />
          </div>

          {/* Quick-Add Water Pill Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLogWater(150)}
              className="border-slate-800 bg-slate-950/70 hover:bg-blue-950/30 hover:border-blue-500/40 text-xs text-blue-300 font-medium"
            >
              +150 ml (Cup)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLogWater(250)}
              className="border-slate-800 bg-slate-950/70 hover:bg-blue-950/30 hover:border-blue-500/40 text-xs text-blue-300 font-medium"
            >
              +250 ml (Glass)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLogWater(500)}
              className="border-slate-800 bg-slate-950/70 hover:bg-blue-950/30 hover:border-blue-500/40 text-xs text-blue-300 font-medium"
            >
              +500 ml (Bottle)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLogWater(1000)}
              className="border-slate-800 bg-slate-950/70 hover:bg-blue-950/30 hover:border-blue-500/40 text-xs text-blue-300 font-medium"
            >
              +1000 ml (1L)
            </Button>
          </div>
        </Card>

        {/* Nutritional Insights Cards */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 text-xs flex items-start gap-3 ${
                  ins.type === "warning"
                    ? "border-amber-500/30 bg-amber-950/20 text-amber-200"
                    : ins.type === "success"
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                    : "border-blue-500/30 bg-blue-950/20 text-blue-200"
                }`}
              >
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">
                    {isUr ? ins.titleUr : ins.titleEn}
                  </h4>
                  <p className="leading-relaxed opacity-90">
                    {isUr ? ins.messageUr : ins.messageEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meals Diary Section (Breakfast, Lunch, Dinner, Snacks) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">
            {isUr ? "کھانوں کی فہرست" : "Meals & Food Entries"}
          </h2>

          {(["breakfast", "lunch", "dinner", "snack"] as const).map((category) => {
            const meal = mealBreakdown[category];
            const titles: Record<string, { en: string; ur: string }> = {
              breakfast: { en: "Breakfast", ur: "ناشتہ" },
              lunch: { en: "Lunch", ur: "دوپہر کا کھانا" },
              dinner: { en: "Dinner", ur: "رات کا کھانا" },
              snack: { en: "Snacks", ur: "اسنیکس اور پھل" },
            };

            return (
              <Card key={category} className="border-slate-800 bg-slate-900/60 overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-800/80 bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white capitalize">
                        {isUr ? titles[category].ur : titles[category].en}
                      </CardTitle>
                      <span className="text-[11px] text-slate-400">
                        {meal.calories} kcal • {meal.protein}g protein • {meal.carbs}g carbs •{" "}
                        {meal.fat}g fat
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveMealCategory(category);
                        setSearchModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Food
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2">
                  {meal.items.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No foods logged for {titles[category].en}. Click 'Add Food' to log your meal.
                    </p>
                  ) : (
                    meal.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                            <Utensils className="h-4 w-4 text-emerald-400" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {isUr && item.foodNameUr ? item.foodNameUr : item.foodNameEn}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {item.quantity} {item.unit} ({item.weightGrams}g)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-emerald-400 block">
                              {Math.round(item.calories)} kcal
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.proteinGrams}g P • {item.carbsGrams}g C • {item.fatGrams}g F
                            </span>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteFoodEntry(item.id)}
                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Food Search & Quick Add Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Add Food to <span className="text-emerald-400 capitalize">{activeMealCategory}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select from Pakistani database, favourites, or recent foods
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>

            {/* Tab Controls */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-1">
              <button
                onClick={() => setSearchTab("search")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  searchTab === "search"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Food Database
              </button>
              <button
                onClick={() => setSearchTab("favourites")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  searchTab === "favourites"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Favourites ({quickFoods?.favourites?.length || 0})
              </button>
              <button
                onClick={() => setSearchTab("recent")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  searchTab === "recent"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Recent Foods ({quickFoods?.recent?.length || 0})
              </button>
            </div>

            {/* Search Input (When on search tab) */}
            {searchTab === "search" && (
              <div className="p-3 border-b border-slate-800/80 bg-slate-950/20">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    placeholder="Search e.g. Chicken, Eggs, Rice, Daal, Roti..."
                    className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {searchTab === "search" &&
                filteredCatalog.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {isUr && food.nameUr ? food.nameUr : food.nameEn}
                        </h4>
                        <button
                          onClick={() => handleToggleFavourite(food.id)}
                          className="text-slate-500 hover:text-amber-400 transition"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {Math.round(food.caloriesPer100g)} kcal / 100g • {food.proteinPer100g}g P
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLogFood(food)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        + Log
                      </Button>
                    </div>
                  </div>
                ))}

              {searchTab === "favourites" &&
                quickFoods?.favourites?.map((fav: any) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{fav.food?.nameEn}</h4>
                      <span className="text-[11px] text-slate-400">
                        {fav.food?.caloriesPer100g} kcal/100g
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLogFood(fav.food)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                    >
                      + Quick Log
                    </Button>
                  </div>
                ))}

              {searchTab === "recent" &&
                quickFoods?.recent?.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{rec.foodNameEn}</h4>
                      <span className="text-[11px] text-slate-400">
                        {rec.quantity} {rec.unit} • {Math.round(rec.calories)} kcal
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleLogFood({
                          id: rec.foodItemId,
                          nameEn: rec.foodNameEn,
                          nameUr: rec.foodNameUr,
                          defaultServingUnit: rec.unit,
                        })
                      }
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                    >
                      + Repeat
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Meal Plan Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Import Planned Meals ({selectedDate})
                </h3>
                <p className="text-xs text-slate-400">
                  Select foods to import. Repeated imports will not duplicate entries.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMealPlan?.mealPlans?.[0]?.meals?.map((m: any) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                >
                  <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase">
                    <span>{m.nameEn}</span>
                    <span>{m.totalCalories} kcal</span>
                  </div>

                  <div className="space-y-1.5">
                    {m.items?.map((it: any) => {
                      const isSelected = selectedImportItems.includes(it.id);
                      return (
                        <label
                          key={it.id}
                          className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedImportItems(
                                    selectedImportItems.filter((id) => id !== it.id)
                                  );
                                } else {
                                  setSelectedImportItems([...selectedImportItems, it.id]);
                                }
                              }}
                              className="rounded accent-emerald-500"
                            />
                            <span>{it.nameEn}</span>
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {it.quantity} {it.unit} • {Math.round(it.calories)} kcal
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(false)}
                className="text-xs text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={actionLoading || selectedImportItems.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {actionLoading ? "Importing..." : `Import ${selectedImportItems.length} Foods`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Water Goal Modal */}
      {waterGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Daily Water Target (ml)</h3>
            <p className="text-xs text-slate-400">
              Customize your daily fluid target (standard baseline is ~2000–3000 ml).
            </p>
            <Input
              type="number"
              min={500}
              max={10000}
              step={100}
              value={customWaterGoal}
              onChange={(e) => setCustomWaterGoal(parseInt(e.target.value, 10) || 2500)}
              className="bg-slate-950 border-slate-800 text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setWaterGoalModalOpen(false)}
                className="text-xs text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateWaterGoal}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Save Goal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

