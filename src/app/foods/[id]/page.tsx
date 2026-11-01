"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Wheat,
  Apple,
  Carrot,
  Droplets,
  Flame,
  Scale,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Calculator,
  ChevronRight,
  TrendingDown,
  Info,
  ShieldCheck,
  Building,
  Loader2,
  ExternalLink,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  protein: Dumbbell,
  carbohydrates: Wheat,
  fruits: Apple,
  vegetables: Carrot,
  healthy_fats: Droplets,
};

const COMMON_PAKISTANI_CITIES = [
  "Kotli",
  "Rawalpindi",
  "Islamabad",
  "Lahore",
  "Karachi",
];

export default function FoodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, isRtl } = useI18n();
  const foodId = params.id as string;

  const [food, setFood] = useState<any>(null);
  const [translations, setTranslations] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Portion Calculator State
  const [servingView, setServingView] = useState<"100g" | "default">("100g");
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<string>("serving");
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function fetchFoodDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/foods/${foodId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Food item not found in the Pakistani nutrition database.");
          } else {
            setError("Failed to load food details. Please try again.");
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setFood(data.food);
        setTranslations(data.translations || []);
        setPrices(data.prices || []);

        // Initialize calculator with food's default serving unit
        if (data.food) {
          const defaultUnit = data.food.defaultServingUnit || "serving";
          const defaultQty = Number(data.food.defaultServingSize) || 1;
          setCalcUnit(defaultUnit);
          setCalcQty(defaultQty);
          // Initial calculation for default serving
          calculateServing(data.food.id, defaultQty, defaultUnit);
        }
      } catch (err: any) {
        console.error("Error fetching food:", err);
        setError("Network error loading food data.");
      } finally {
        setLoading(false);
      }
    }

    if (foodId) {
      fetchFoodDetail();
    }
  }, [foodId]);

  async function calculateServing(id: string, qty: number, unit: string) {
    if (!qty || qty <= 0) return;
    setCalculating(true);
    try {
      const res = await fetch("/api/v1/foods/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: id, quantity: qty, unit }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
      }
    } catch (err) {
      console.error("Calculation error:", err);
    } finally {
      setCalculating(false);
    }
  }

  function handleCalcSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (food) {
      calculateServing(food.id, calcQty, calcUnit);
    }
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const CategoryIcon = food ? CATEGORY_ICONS[food.categorySlug] || Dumbbell : Dumbbell;

  // Compute macro percentages for the visual bar (based on 100g)
  let proteinCalPct = 0;
  let carbsCalPct = 0;
  let fatCalPct = 0;
  if (food) {
    const pCals = Number(food.proteinPer100g) * 4;
    const cCals = Number(food.carbsPer100g) * 4;
    const fCals = Number(food.fatPer100g) * 9;
    const totalCals = pCals + cCals + fCals;
    if (totalCals > 0) {
      proteinCalPct = Math.round((pCals / totalCals) * 100);
      carbsCalPct = Math.round((cCals / totalCals) * 100);
      fatCalPct = 100 - proteinCalPct - carbsCalPct;
    }
  }

  // Protein cost efficiency: if food has protein, find average or lowest verified price
  const proteinPer100g = food ? Number(food.proteinPer100g) : 0;
  let costPer20gProtein: number | null = null;
  let bestPriceCity = "";
  if (proteinPer100g > 0 && prices.length > 0) {
    // Find price per standard unit (assumed kg or litre or piece)
    const validPrices = prices.filter(p => Number(p.price) > 0);
    if (validPrices.length > 0) {
      const p = validPrices[0];
      let pricePer100g = 0;
      if (p.standardUnit === "kg" || p.unit === "kg") {
        pricePer100g = Number(p.price) / 10;
      } else if (p.standardUnit === "l" || p.unit === "liter") {
        pricePer100g = Number(p.price) / 10;
      } else if (p.unit === "g") {
        pricePer100g = (Number(p.price) / Number(p.quantity)) * 100;
      } else if (p.unit === "dozen" && (food?.nameEn.toLowerCase().includes("egg") || food?.categorySlug === "protein")) {
        // 1 dozen eggs = 12 * 50g = 600g
        pricePer100g = Number(p.price) / 6;
      }

      if (pricePer100g > 0) {
        costPer20gProtein = Math.round((20 / proteinPer100g) * pricePer100g);
        bestPriceCity = p.city;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/foods"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>{t.foodDetail.backToExplorer}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/calculator">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold rounded-xl">
                <Calculator className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t.common.calculator}</span>
              </Button>
            </Link>
            <Link href="/prices">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold rounded-xl">
                <Building className="h-3.5 w-3.5 text-teal-500" />
                <span>{t.common.prices}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">{t.common.loading}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive/30 bg-destructive/10 p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">{error}</h2>
            <Link href="/foods">
              <Button variant="default" size="sm" className="rounded-xl">
                {t.foodDetail.backToExplorer}
              </Button>
            </Link>
          </Card>
        )}

        {food && !loading && (
          <>
            {/* HERO CARD */}
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 shadow-xl">
              <div className="absolute -top-24 -end-24 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-6 flex-1">
                  {/* Category / Food Icon Box */}
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                    <CategoryIcon className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider bg-background/60">
                        {isRtl ? food.categoryNameUr : food.categoryNameEn}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-semibold capitalize">
                        {food.foodType}
                      </Badge>
                      {food.isCommonPakistaniFood && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          🇵🇰 {t.foodDetail.pakistaniStapleBadge}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                        {food.nameEn}
                      </h1>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-urdu" dir="rtl">
                        {food.nameUr}
                      </p>
                    </div>

                    {(food.descriptionEn || food.descriptionUr) && (
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        {isRtl && food.descriptionUr ? food.descriptionUr : (food.descriptionEn || food.descriptionUr)}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-muted-foreground/80">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                      <span>{t.foodDetail.sourceReference}: <strong className="text-foreground">{food.nutritionSource}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Protein Efficiency Highlight (if applicable) */}
                {costPer20gProtein && (
                  <div className="w-full md:w-auto shrink-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center shadow-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      <Sparkles className="h-4 w-4" />
                      <span>{t.foodDetail.proteinEfficiency}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        PKR {costPer20gProtein}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">/ 20g protein</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      In {bestPriceCity} &bull; {costPer20gProtein < 50 ? "⭐️ High Cost-Efficiency" : costPer20gProtein < 120 ? "Good Budget Source" : "Standard Source"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NUTRITION FACTS & PORTION CALCULATOR GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Official Nutrition Facts (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="rounded-3xl border border-border/80 shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-500" />
                        <span>{t.foodDetail.nutritionFacts}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {servingView === "100g"
                          ? `${t.foodDetail.per100g} (Standard Reference Base)`
                          : `${t.foodDetail.perServing}: ${food.defaultServingSize} ${food.defaultServingUnit} (${food.servingWeightGrams}g)`}
                      </CardDescription>
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex items-center rounded-xl bg-muted/70 p-1 border border-border/60">
                      <button
                        type="button"
                        onClick={() => setServingView("100g")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          servingView === "100g"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        100g
                      </button>
                      <button
                        type="button"
                        onClick={() => setServingView("default")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          servingView === "default"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        1 {food.defaultServingUnit}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Big Stats Row */}
                    {(() => {
                      const mult = servingView === "100g" ? 1 : Number(food.servingWeightGrams || 100) / 100;
                      const cals = Math.round(Number(food.caloriesPer100g) * mult);
                      const protein = (Number(food.proteinPer100g) * mult).toFixed(1);
                      const carbs = (Number(food.carbsPer100g) * mult).toFixed(1);
                      const fat = (Number(food.fatPer100g) * mult).toFixed(1);
                      const fibre = (Number(food.fibrePer100g) * mult).toFixed(1);

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                            <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                            <div className="text-xl font-black text-foreground">{cals}</div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.calories}</div>
                          </div>

                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                            <Dumbbell className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                            <div className="text-xl font-black text-foreground">{protein}g</div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.protein}</div>
                          </div>

                          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                            <Wheat className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <div className="text-xl font-black text-foreground">{carbs}g</div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.carbs}</div>
                          </div>

                          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                            <Droplets className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                            <div className="text-xl font-black text-foreground">{fat}g</div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.fat}</div>
                          </div>

                          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 text-center">
                            <Carrot className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                            <div className="text-xl font-black text-foreground">{fibre}g</div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.fibre}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Macronutrient Calorie Breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{t.foodDetail.macroDistribution} (% of Calories)</span>
                        <span className="text-muted-foreground text-[11px]">
                          P: {proteinCalPct}% &bull; C: {carbsCalPct}% &bull; F: {fatCalPct}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${proteinCalPct}%` }}
                          className="bg-emerald-500 h-full transition-all"
                          title={`Protein: ${proteinCalPct}%`}
                        />
                        <div
                          style={{ width: `${carbsCalPct}%` }}
                          className="bg-blue-500 h-full transition-all"
                          title={`Carbohydrates: ${carbsCalPct}%`}
                        />
                        <div
                          style={{ width: `${fatCalPct}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Fat: ${fatCalPct}%`}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t.foodExplorer.protein}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> {t.foodExplorer.carbs}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> {t.foodExplorer.fat}
                        </span>
                      </div>
                    </div>

                    {/* Scientific Source Footnote */}
                    <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Info className="h-4 w-4 text-emerald-500" />
                        <span>Nutrition Integrity Standard</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Values are certified by <strong className="text-foreground">{food.nutritionSource}</strong>. Nutritional density accounts for state variations (e.g. raw vs cooked rice/meat). Fitness calculations are deterministic and non-synthetic.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Interactive Portion Calculator (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-card to-emerald-500/5 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-emerald-500" />
                      <span>{t.foodDetail.customCalculator}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Adjust your exact serving size to calculate tailored calories & macros in real time.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <form onSubmit={handleCalcSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">
                            {t.foodDetail.quantity}
                          </label>
                          <Input
                            type="number"
                            min="0.1"
                            step="any"
                            value={calcQty}
                            onChange={(e) => setCalcQty(parseFloat(e.target.value) || 0)}
                            className="h-10 text-sm font-semibold rounded-xl"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">
                            {t.foodDetail.unit}
                          </label>
                          <select
                            value={calcUnit}
                            onChange={(e) => setCalcUnit(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="serving">Standard Serving ({food.servingWeightGrams}g)</option>
                            <option value="g">Grams (g)</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="cup">Cup</option>
                            <option value="piece">Piece / Item</option>
                            <option value="tbsp">Tablespoon (tbsp)</option>
                            <option value="tsp">Teaspoon (tsp)</option>
                            <option value="ml">Millilitres (ml)</option>
                            <option value="l">Litres (L)</option>
                            <option value="dozen">Dozen (12 pcs)</option>
                          </select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={calculating || calcQty <= 0}
                        variant="default"
                        className="w-full font-bold text-xs h-10 rounded-xl gap-2 shadow-sm"
                      >
                        {calculating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>{t.foodDetail.calculate}</span>
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Calculated Output Display */}
                    {calcResult && (
                      <div className="space-y-3 pt-3 border-t border-border/60 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-foreground">Portion Weight:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {calcResult.weightInGrams}g
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold">{t.foodExplorer.calories}:</span>
                            <span className="font-black text-foreground">{calcResult.nutrition.calories} kcal</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold">{t.foodExplorer.protein}:</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{calcResult.nutrition.protein}g</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold">{t.foodExplorer.carbs}:</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">{calcResult.nutrition.carbs}g</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold">{t.foodExplorer.fat}:</span>
                            <span className="font-black text-rose-600 dark:text-rose-400">{calcResult.nutrition.fat}g</span>
                          </div>
                        </div>

                        <Link href={`/calculator?food=${food.id}&qty=${calcQty}&unit=${calcUnit}`}>
                          <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted-foreground hover:text-foreground mt-2">
                            <span>Open in Full Cost Calculator</span>
                            <ChevronRight className="h-4 w-4 ms-1" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* MULTI-CITY REGIONAL FOOD PRICING SECTION */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                    <span>{t.foodDetail.regionalPrices}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Direct prices from District Administration rate lists, verified suppliers, and surveyed retailers.
                  </p>
                </div>

                <Link href="/prices">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl gap-1.5">
                    <span>View All City Price Lists</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* City Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {COMMON_PAKISTANI_CITIES.map((cityName) => {
                  const cityPrice = prices.find(
                    (p) => p.city.toLowerCase() === cityName.toLowerCase()
                  );

                  if (cityPrice) {
                    const isVerified = cityPrice.verificationStatus === "verified";
                    const isUnderReview = cityPrice.verificationStatus === "under_review";
                    const isExpired = cityPrice.verificationStatus === "expired";

                    return (
                      <Card
                        key={cityName}
                        className="rounded-2xl border border-emerald-500/20 bg-card hover:border-emerald-500/40 transition-all shadow-sm"
                      >
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                              <span className="font-extrabold text-sm text-foreground">
                                {cityName}
                              </span>
                            </div>

                            {/* Verification Badge */}
                            {isVerified && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{t.foodPricing.verified}</span>
                              </Badge>
                            )}
                            {isUnderReview && (
                              <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-[10px] font-bold gap-1">
                                <RefreshCw className="h-3 w-3" />
                                <span>{t.foodPricing.underReview}</span>
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="secondary" className="text-muted-foreground text-[10px] font-bold gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{t.foodPricing.expired}</span>
                              </Badge>
                            )}
                            {!isVerified && !isUnderReview && !isExpired && (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] font-bold gap-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>{t.foodPricing.unverified}</span>
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-2xl font-black text-foreground">
                              PKR {cityPrice.price}
                            </div>
                            <div className="text-xs text-muted-foreground font-semibold">
                              per {cityPrice.quantity} {cityPrice.unit}
                            </div>
                          </div>

                          <div className="border-t border-border/60 pt-2.5 space-y-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Market / Retailer:</span>
                              <span className="font-bold text-foreground truncate max-w-[150px]">
                                {cityPrice.marketRetailer || "General Market"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Source:</span>
                              <span className="font-medium truncate max-w-[150px]">
                                {cityPrice.sourceName || "Government Rate List"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{t.foodPricing.lastUpdated}:</span>
                              <span>{cityPrice.collectionDate || "Recent"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Missing City State
                  return (
                    <Card
                      key={cityName}
                      className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground/60" />
                            <span className="font-bold text-sm text-muted-foreground">
                              {cityName}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                            No Verified Rate
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed">
                          Official market list not recorded yet for {cityName}. FitLife AI does not fabricate food prices.
                        </p>
                      </div>

                      <div className="pt-4">
                        <Link href="/prices">
                          <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted-foreground hover:text-foreground">
                            Check Other Cities
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
