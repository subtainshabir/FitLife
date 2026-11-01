"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  Search,
  Dumbbell,
  Wheat,
  Apple,
  Carrot,
  Droplets,
  Filter,
  ArrowUpDown,
  Flame,
  Scale,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Calculator,
  Loader2,
  X,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  protein: Dumbbell,
  carbohydrates: Wheat,
  fruits: Apple,
  vegetables: Carrot,
  healthy_fats: Droplets,
};

function FoodExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();

  const [categories, setCategories] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, totalItems: 0 });

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [foodType, setFoodType] = useState(searchParams.get("foodType") || "");
  const [highProteinOnly, setHighProteinOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "Rawalpindi");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [availableCities, setAvailableCities] = useState<string[]>([
    "Kotli",
    "Rawalpindi",
    "Islamabad",
    "Lahore",
    "Karachi",
  ]);

  // Load Categories & Distinct Cities
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, priceRes] = await Promise.all([
          fetch("/api/v1/foods/categories"),
          fetch("/api/v1/foods/prices"),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (priceRes.ok) {
          const priceData = await priceRes.json();
          if (priceData.availableCities?.length > 0) {
            setAvailableCities(priceData.availableCities.map((c: any) => c.city));
          }
        }
      } catch (err) {
        console.error("Meta load error:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Foods on Filter Change
  async function fetchFoods(pageNumber = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      if (foodType) params.set("foodType", foodType);
      if (highProteinOnly) params.set("minProtein", "15");
      if (selectedCity) params.set("city", selectedCity);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", pageNumber.toString());
      params.set("limit", "24");

      const res = await fetch(`/api/v1/foods?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data.foods || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Foods fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFoods(1);
  }, [selectedCategory, foodType, highProteinOnly, selectedCity, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFoods(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setFoodType("");
    setHighProteinOnly(false);
    setSortBy("name");
    setSortOrder("asc");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardNav />

      <main className="flex-1 container mx-auto px-3 sm:px-6 md:px-8 py-6 sm:py-8 pb-24 md:pb-12 max-w-7xl">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Apple className="h-3.5 w-3.5 shrink-0" />
                <span>Phase 3: Pakistani Food & Local Pricing</span>
              </span>
              <span className="text-xs text-muted-foreground">FCT Pakistan &bull; DC Rate Lists</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight mt-1 break-words">
              {t.foodExplorer.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t.foodExplorer.subtitle}
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/prices">
              <Button variant="outline" className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-4 w-4" />
                <span>{t.common.prices}</span>
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="gradient" className="rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-emerald-500/20">
                <Calculator className="h-4 w-4" />
                <span>{t.common.calculator}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & City Filter Bar */}
        <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm mb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.foodExplorer.searchPlaceholder}
                className={`rounded-2xl text-xs ${isRtl ? "pr-10" : "pl-10"}`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    fetchFoods(1);
                  }}
                  className={`absolute ${isRtl ? "left-3.5" : "right-3.5"} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* City Selector for Localized Prices */}
            <div className="flex items-center gap-2 sm:w-64">
              <div className="relative w-full">
                <MapPin className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500`} />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className={`w-full rounded-2xl border border-input bg-background py-2 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isRtl ? "pr-9 pl-3" : "pl-9 pr-3"
                  }`}
                >
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city} ({city === "Kotli" ? "AJK" : "Market"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" variant="gradient" className="rounded-2xl text-xs font-bold px-6">
              <Search className="h-4 w-4 me-1.5" />
              <span>Search</span>
            </Button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === ""
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t.foodExplorer.allCategories}
            </button>
            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.slug] || Apple;
              const isSelected = selectedCategory === cat.slug;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "" : cat.slug)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{isRtl ? cat.nameUr : cat.nameEn}</span>
                  {cat.itemCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-background text-muted-foreground"}`}>
                      {cat.itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Filter & Sort Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* High Protein Toggle */}
              <button
                type="button"
                onClick={() => setHighProteinOnly(!highProteinOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  highProteinOnly
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Dumbbell className="h-3 w-3 inline me-1" />
                <span>{t.foodExplorer.highProtein}</span>
              </button>

              {/* Food Variant Filter */}
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="rounded-xl border border-border/60 bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus-visible:outline-none"
              >
                <option value="">{t.foodExplorer.foodType}: All</option>
                <option value="raw">{t.foodExplorer.raw}</option>
                <option value="cooked">{t.foodExplorer.cooked}</option>
                <option value="prepared">{t.foodExplorer.prepared}</option>
                <option value="beverage">{t.foodExplorer.beverage}</option>
                <option value="pantry">{t.foodExplorer.pantry}</option>
              </select>

              {(search || selectedCategory || foodType || highProteinOnly) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-destructive underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">{t.foodExplorer.sortBy}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-border/60 bg-background px-2.5 py-1 text-xs font-bold text-foreground focus-visible:outline-none"
              >
                <option value="name">{t.foodExplorer.sortName}</option>
                <option value="protein">{t.foodExplorer.sortProtein}</option>
                <option value="calories">{t.foodExplorer.sortCalories}</option>
                <option value="price">{t.foodExplorer.sortPrice}</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOD CARDS GRID */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : foods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {foods.map((food) => {
              const activePrice = food.activePrice;

              return (
                <div
                  key={food.id}
                  className="group rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Food Photo Header */}
                    <div className="relative h-44 overflow-hidden bg-slate-900">
                      <img
                        src={food.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"}
                        alt={food.nameEn}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />

                      {/* Category Badge */}
                      <div className="absolute top-3 start-3">
                        <span className="rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                          {isRtl ? food.categoryNameUr : food.categoryNameEn}
                        </span>
                      </div>

                      {/* Variant Badge */}
                      <div className="absolute top-3 end-3">
                        <span className="rounded-xl bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          {food.foodType}
                        </span>
                      </div>

                      {/* Calorie Pill on image bottom */}
                      <div className="absolute bottom-3 start-3">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-card/90 backdrop-blur-md px-2.5 py-1 text-xs font-black text-foreground shadow">
                          <Flame className="h-3.5 w-3.5 text-amber-500" />
                          <span>{food.caloriesPer100g} kcal</span>
                          <span className="text-[10px] font-normal text-muted-foreground">/100g</span>
                        </span>
                      </div>
                    </div>

                    {/* Food Details Body */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {food.nameEn}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground line-clamp-1 font-sans">
                          {food.nameUr}
                        </p>
                      </div>

                      {/* Nutrition Macro Pills */}
                      <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-1 px-1.5">
                          <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                            Protein
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {food.proteinPer100g}g
                          </span>
                        </div>
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 py-1 px-1.5">
                          <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                            Carbs
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {food.carbsPer100g}g
                          </span>
                        </div>
                        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 py-1 px-1.5">
                          <span className="text-[9px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block">
                            Fat
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {food.fatPer100g}g
                          </span>
                        </div>
                      </div>

                      {/* Local Market Price Tag */}
                      <div className="rounded-2xl border border-border/80 bg-muted/40 p-2.5 flex items-center justify-between text-xs mt-2">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                            <MapPin className="h-3 w-3 text-emerald-500" />
                            <span>{selectedCity} Price</span>
                          </div>
                          {activePrice ? (
                            <div className="font-black text-foreground text-xs mt-0.5">
                              PKR {activePrice.price}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                / {activePrice.quantity > 1 ? `${activePrice.quantity} ` : ""}{activePrice.unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              {t.foodExplorer.noPriceRecorded}
                            </span>
                          )}
                        </div>

                        {activePrice?.verificationStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Verified</span>
                          </span>
                        ) : activePrice ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 text-[10px] font-bold border border-amber-500/30">
                            Review
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 flex items-center gap-2">
                    <Link href={`/foods/${food.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-bold">
                        <span>{t.foodExplorer.viewDetails}</span>
                      </Button>
                    </Link>
                    <Link href={`/calculator?foodId=${food.id}&city=${selectedCity}`}>
                      <Button variant="gradient" size="sm" className="rounded-xl px-2.5" title="Calculate Macros">
                        <Calculator className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <Card className="rounded-3xl border-dashed border-2 border-border/80 p-12 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-muted text-muted-foreground flex items-center justify-center">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">
              No matching foods found
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Try adjusting your search keywords, clearing your filters, or switching to "All Categories".
            </p>
            <Button onClick={clearFilters} variant="outline" className="rounded-xl text-xs font-bold">
              Clear All Filters
            </Button>
          </Card>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => fetchFoods(pagination.page - 1)}
              className="rounded-xl text-xs font-bold"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground font-semibold px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => fetchFoods(pagination.page + 1)}
              className="rounded-xl text-xs font-bold"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function FoodExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FoodExplorerContent />
    </Suspense>
  );
}
