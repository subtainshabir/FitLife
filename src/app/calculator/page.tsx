"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  Calculator,
  Flame,
  Dumbbell,
  Wheat,
  Droplets,
  Carrot,
  Scale,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Layers,
  UtensilsCrossed,
} from "lucide-react";

function NutritionCalculatorContent() {
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();

  // Mode: 'single' vs 'plate'
  const [calculatorMode, setCalculatorMode] = useState<"single" | "plate">("single");

  // Foods catalog for dropdown selection
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Single Item Calculator State
  const [selectedFoodId, setSelectedFoodId] = useState<string>(
    searchParams.get("food") || ""
  );
  const [quantity, setQuantity] = useState<number>(
    parseFloat(searchParams.get("qty") || "1") || 1
  );
  const [unit, setUnit] = useState<string>(
    searchParams.get("unit") || "serving"
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    searchParams.get("city") || "Rawalpindi"
  );

  const [calculating, setCalculating] = useState(false);
  const [singleNutrition, setSingleNutrition] = useState<any>(null);
  const [singleCost, setSingleCost] = useState<any>(null);
  const [hasPrice, setHasPrice] = useState(true);

  // Meal Plate Builder State (multiple foods)
  const [plateItems, setPlateItems] = useState<Array<{
    id: string;
    foodId: string;
    foodNameEn: string;
    foodNameUr: string;
    quantity: number;
    unit: string;
    nutrition?: any;
    cost?: any;
  }>>([]);

  const [plateTotals, setPlateTotals] = useState<any>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
    weightGrams: 0,
    totalCost: 0,
  });

  // Load All Foods and Cities
  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const [foodsRes, pricesRes] = await Promise.all([
          fetch("/api/v1/foods?pageSize=100"),
          fetch("/api/v1/foods/prices"),
        ]);

        if (foodsRes.ok) {
          const foodsData = await foodsRes.json();
          setAllFoods(foodsData.foods || []);
          if (!selectedFoodId && foodsData.foods?.length > 0) {
            setSelectedFoodId(foodsData.foods[0].id);
          }
        }

        if (pricesRes.ok) {
          const pricesData = await pricesRes.json();
          if (pricesData.availableCities?.length > 0) {
            setAvailableCities(pricesData.availableCities);
          }
        }
      } catch (err) {
        console.error("Meta loading error:", err);
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMeta();
  }, []);

  // Set default serving unit when food selection changes
  useEffect(() => {
    if (selectedFoodId && allFoods.length > 0) {
      const selected = allFoods.find((f) => f.id === selectedFoodId);
      if (selected && !searchParams.get("unit")) {
        setUnit(selected.defaultServingUnit || "serving");
        setQuantity(Number(selected.defaultServingSize) || 1);
      }
    }
  }, [selectedFoodId, allFoods]);

  // Compute single food nutrition & cost
  async function computeSingle() {
    if (!selectedFoodId || quantity <= 0) return;
    setCalculating(true);
    try {
      // 1. Calculate Nutrition
      const nutRes = await fetch("/api/v1/foods/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: selectedFoodId, quantity, unit }),
      });
      if (nutRes.ok) {
        const nutData = await nutRes.json();
        setSingleNutrition(nutData);
      }

      // 2. Calculate Cost in Selected City
      const costRes = await fetch("/api/v1/foods/calculate-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: selectedFoodId, quantity, unit, city: selectedCity }),
      });
      if (costRes.ok) {
        const costData = await costRes.json();
        setSingleCost(costData.cost);
        setHasPrice(costData.hasPrice);
      } else {
        setSingleCost(null);
        setHasPrice(false);
      }
    } catch (err) {
      console.error("Calculation error:", err);
    } finally {
      setCalculating(false);
    }
  }

  // Trigger calculation on initial load or parameter change
  useEffect(() => {
    if (selectedFoodId) {
      computeSingle();
    }
  }, [selectedFoodId, selectedCity]);

  // Handle Adding Item to Meal Plate
  async function handleAddToPlate() {
    if (!selectedFoodId || quantity <= 0) return;
    const food = allFoods.find((f) => f.id === selectedFoodId);
    if (!food) return;

    // Calculate nutrition for this item
    try {
      const [nutRes, costRes] = await Promise.all([
        fetch("/api/v1/foods/calculate-nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId: selectedFoodId, quantity, unit }),
        }),
        fetch("/api/v1/foods/calculate-cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId: selectedFoodId, quantity, unit, city: selectedCity }),
        }),
      ]);

      const nutData = nutRes.ok ? await nutRes.json() : null;
      const costData = costRes.ok ? await costRes.json() : null;

      const newItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        foodId: food.id,
        foodNameEn: food.nameEn,
        foodNameUr: food.nameUr,
        quantity,
        unit,
        nutrition: nutData,
        cost: costData?.cost || null,
      };

      const updatedPlate = [...plateItems, newItem];
      setPlateItems(updatedPlate);
      recalculatePlateTotals(updatedPlate);
      setCalculatorMode("plate");
    } catch (err) {
      console.error("Error adding to plate:", err);
    }
  }

  function handleRemoveFromPlate(itemId: string) {
    const updated = plateItems.filter((i) => i.id !== itemId);
    setPlateItems(updated);
    recalculatePlateTotals(updated);
  }

  function recalculatePlateTotals(items: typeof plateItems) {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fibre = 0;
    let weightGrams = 0;
    let totalCost = 0;

    for (const item of items) {
      if (item.nutrition?.nutrition) {
        calories += item.nutrition.nutrition.calories || 0;
        protein += item.nutrition.nutrition.protein || 0;
        carbs += item.nutrition.nutrition.carbs || 0;
        fat += item.nutrition.nutrition.fat || 0;
        fibre += item.nutrition.nutrition.fibre || 0;
        weightGrams += item.nutrition.weightInGrams || 0;
      }
      if (item.cost?.estimatedCostPkr) {
        totalCost += item.cost.estimatedCostPkr;
      }
    }

    setPlateTotals({
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fibre: Math.round(fibre * 10) / 10,
      weightGrams: Math.round(weightGrams),
      totalCost: Math.round(totalCost),
    });
  }

  const selectedFood = allFoods.find((f) => f.id === selectedFoodId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-xl">
          <div className="absolute -top-24 -end-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Calculator className="h-3.5 w-3.5" />
                <span>Deterministic Nutrition Engine &bull; Non-AI</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                {t.foodCalculator.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {t.foodCalculator.subtitle} Scaled proportionally by serving weight and cross-referenced with real Pakistani market prices.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setCalculatorMode("single")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  calculatorMode === "single"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>Single Item</span>
              </button>

              <button
                type="button"
                onClick={() => setCalculatorMode("plate")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  calculatorMode === "plate"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>Meal Plate Builder ({plateItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CALCULATOR GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-3xl border border-border/80 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-500" />
                  <span>Configure Portion & Location</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose a food item, input your exact portion, and select a Pakistani city for real-time pricing.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 1. Food Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {t.foodCalculator.selectFood}
                  </label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-input bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={loadingMeta}
                  >
                    {allFoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nameEn} ({f.nameUr}) - {f.categoryNameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      {t.foodCalculator.quantity}
                    </label>
                    <Input
                      type="number"
                      min="0.1"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="h-11 text-sm font-semibold rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      {t.foodCalculator.unit}
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-input bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {selectedFood && (
                        <option value="serving">
                          Standard Serving ({selectedFood.servingWeightGrams}g)
                        </option>
                      )}
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

                {/* 3. City Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{t.foodCalculator.city}</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-input bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kotli">Kotli (AJK)</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    {availableCities
                      .filter(
                        (c) => !["Kotli", "Rawalpindi", "Islamabad", "Lahore", "Karachi"].includes(c.city)
                      )
                      .map((c) => (
                        <option key={c.city} value={c.city}>
                          {c.city} ({c.province})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <Button
                    type="button"
                    onClick={computeSingle}
                    disabled={calculating || quantity <= 0}
                    variant="default"
                    className="w-full h-11 text-xs font-bold rounded-xl gap-2 shadow-md shadow-emerald-500/20"
                  >
                    {calculating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>{t.foodCalculator.calculateBtn}</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAddToPlate}
                    variant="outline"
                    className="w-full h-10 text-xs font-bold rounded-xl gap-2"
                  >
                    <Plus className="h-4 w-4 text-emerald-500" />
                    <span>Add Item to Meal Plate</span>
                  </Button>
                </div>

                {/* Quick Food Link */}
                {selectedFood && (
                  <div className="pt-2 text-center">
                    <Link
                      href={`/foods/${selectedFood.id}`}
                      className="text-xs font-bold text-muted-foreground hover:text-emerald-500 inline-flex items-center gap-1"
                    >
                      <span>View full food profile for {selectedFood.nameEn}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deterministic Standard Note */}
            <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Info className="h-4 w-4 text-emerald-500" />
                <span>Deterministic Conversion Guarantee</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Household servings (cups, spoons, pieces) use density-weighted gram equivalents specific to each food (e.g. 1 cup cooked rice &asymp; 158g, 1 egg &asymp; 50g, 1 cup oats &asymp; 80g). Calculations are completely independent of generative AI.
              </p>
            </div>
          </div>

          {/* Right Column: Output & Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* SINGLE MODE OUTPUT */}
            {calculatorMode === "single" && (
              <div className="space-y-6">
                {singleNutrition ? (
                  <>
                    {/* Nutrition Output Card */}
                    <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-card to-emerald-500/5 shadow-md">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-emerald-500" />
                            <span>{t.foodCalculator.summaryTitle}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            For {quantity} {unit} of {singleNutrition.food?.nameEn} ({singleNutrition.weightInGrams}g total portion)
                          </CardDescription>
                        </div>

                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          {singleNutrition.weightInGrams}g Portion
                        </Badge>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Macro Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                            <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                            <div className="text-2xl font-black text-foreground">
                              {singleNutrition.nutrition.calories}
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.calories}</div>
                          </div>

                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                            <Dumbbell className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                            <div className="text-2xl font-black text-foreground">
                              {singleNutrition.nutrition.protein}g
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.protein}</div>
                          </div>

                          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                            <Wheat className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <div className="text-2xl font-black text-foreground">
                              {singleNutrition.nutrition.carbs}g
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.carbs}</div>
                          </div>

                          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                            <Droplets className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                            <div className="text-2xl font-black text-foreground">
                              {singleNutrition.nutrition.fat}g
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.fat}</div>
                          </div>

                          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 text-center">
                            <Carrot className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                            <div className="text-2xl font-black text-foreground">
                              {singleNutrition.nutrition.fibre}g
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground">{t.foodExplorer.fibre}</div>
                          </div>
                        </div>

                        {/* Local Cost Output */}
                        <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-emerald-500" />
                              <span className="font-extrabold text-sm text-foreground">
                                {t.foodCalculator.costOutput} &bull; {selectedCity}
                              </span>
                            </div>

                            {hasPrice && singleCost && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{singleCost.verificationStatus}</span>
                              </Badge>
                            )}
                          </div>

                          {hasPrice && singleCost ? (
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                              <div>
                                <span className="text-3xl font-black text-foreground">
                                  PKR {singleCost.estimatedCostPkr}
                                </span>
                                <span className="text-xs text-muted-foreground ms-2">
                                  for this {quantity} {unit} serving
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Based on rate: <strong>PKR {singleCost.pricePerUnit}</strong> / {singleCost.unit}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{t.foodCalculator.noPriceNote}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="rounded-3xl border border-dashed border-border/80 p-12 text-center text-muted-foreground text-xs font-bold">
                    Select a food item and click Calculate to view nutritional and price results.
                  </Card>
                )}
              </div>
            )}

            {/* PLATE / MEAL BUILDER OUTPUT */}
            {calculatorMode === "plate" && (
              <div className="space-y-6">
                <Card className="rounded-3xl border border-emerald-500/40 bg-card shadow-lg">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
                        <span>Cumulative Meal Plate Output</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Total calories, macronutrients, and market budget across all {plateItems.length} plate items.
                      </CardDescription>
                    </div>

                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      {plateTotals.weightGrams}g Total Food Weight
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Cumulative Big Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                        <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                        <div className="text-2xl font-black text-foreground">
                          {plateTotals.calories}
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground">Calories</div>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                        <Dumbbell className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        <div className="text-2xl font-black text-foreground">
                          {plateTotals.protein}g
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground">Protein</div>
                      </div>

                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                        <Wheat className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-2xl font-black text-foreground">
                          {plateTotals.carbs}g
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground">Carbs</div>
                      </div>

                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                        <Droplets className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                        <div className="text-2xl font-black text-foreground">
                          {plateTotals.fat}g
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground">Fat</div>
                      </div>

                      <div className="col-span-2 sm:col-span-1 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 text-center">
                        <Carrot className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                        <div className="text-2xl font-black text-foreground">
                          {plateTotals.fibre}g
                        </div>
                        <div className="text-[11px] font-bold text-muted-foreground">Fibre</div>
                      </div>
                    </div>

                    {/* Total Meal Cost Card */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Estimated Total Meal Cost in {selectedCity}
                        </div>
                        <div className="text-3xl font-black text-foreground mt-0.5">
                          PKR {plateTotals.totalCost}
                        </div>
                      </div>

                      <div className="text-end text-xs text-muted-foreground">
                        <span>{plateItems.length} Ingredients</span>
                        <div className="text-[11px]">Calculated from verified city prices</div>
                      </div>
                    </div>

                    {/* Items on the plate list */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                        Plate Ingredients Breakdown:
                      </h4>

                      {plateItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          No items on the plate yet. Select foods on the left and click "Add Item to Meal Plate".
                        </p>
                      ) : (
                        plateItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-border/70 bg-card p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-foreground">
                                {item.foodNameEn}
                              </span>
                              <div className="text-[11px] text-muted-foreground">
                                {item.quantity} {item.unit} &bull; {item.nutrition?.weightInGrams}g &bull; {item.nutrition?.nutrition?.calories} kcal &bull; {item.nutrition?.nutrition?.protein}g protein
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-foreground text-sm">
                                {item.cost?.estimatedCostPkr ? `PKR ${item.cost.estimatedCostPkr}` : "Price N/A"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromPlate(item.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function NutritionCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NutritionCalculatorContent />
    </Suspense>
  );
}