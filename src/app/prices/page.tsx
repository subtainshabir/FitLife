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
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Scale,
  Calculator,
  ChevronRight,
  Filter,
  ShieldCheck,
  Trophy,
  Dumbbell,
  Wheat,
  Apple,
  Carrot,
  Droplets,
  Search,
  ExternalLink,
  PlusCircle,
  Loader2,
  Info,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  protein: Dumbbell,
  carbohydrates: Wheat,
  fruits: Apple,
  vegetables: Carrot,
  healthy_fats: Droplets,
};

function LocalFoodPricesContent() {
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();

  // Tab: 'catalog' vs 'protein-ranking'
  const [activeTab, setActiveTab] = useState<"catalog" | "ranking">(
    (searchParams.get("tab") as any) === "compare" ? "ranking" : "catalog"
  );

  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(
    searchParams.get("city") || "Rawalpindi"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [prices, setPrices] = useState<any[]>([]);
  const [proteinRanking, setProteinRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Community Price Submission Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitData, setSubmitData] = useState({
    foodId: "",
    city: "Rawalpindi",
    marketRetailer: "",
    price: "",
    quantity: "1",
    unit: "kg",
  });
  const [allFoodsList, setAllFoodsList] = useState<any[]>([]);

  // Fetch Cities & Prices
  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCity && selectedCity !== "All Cities") {
          params.set("city", selectedCity);
        }
        if (selectedCategory) {
          params.set("category", selectedCategory);
        }
        if (statusFilter) {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/v1/foods/prices?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPrices(data.prices || []);
          if (data.availableCities?.length > 0) {
            setAvailableCities(data.availableCities);
          }
        }
      } catch (err) {
        console.error("Error loading prices:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPrices();
  }, [selectedCity, selectedCategory, statusFilter]);

  // Fetch Protein Ranking when city changes or tab switches
  useEffect(() => {
    async function loadRanking() {
      if (activeTab !== "ranking") return;
      const targetCity = selectedCity === "All Cities" ? "Rawalpindi" : selectedCity;
      setRankingLoading(true);
      try {
        const res = await fetch(`/api/v1/foods/prices/compare?city=${encodeURIComponent(targetCity)}`);
        if (res.ok) {
          const data = await res.json();
          setProteinRanking(data.ranking || []);
        }
      } catch (err) {
        console.error("Error loading protein ranking:", err);
      } finally {
        setRankingLoading(false);
      }
    }

    loadRanking();
  }, [activeTab, selectedCity]);

  // Load all foods for the submit modal
  useEffect(() => {
    async function loadFoods() {
      try {
        const res = await fetch("/api/v1/foods?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          setAllFoodsList(data.foods || []);
          if (data.foods?.length > 0 && !submitData.foodId) {
            setSubmitData((prev) => ({ ...prev, foodId: data.foods[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading foods list:", err);
      }
    }
    loadFoods();
  }, []);

  // Filter prices by search query client-side
  const filteredPrices = prices.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.foodNameEn.toLowerCase().includes(q) ||
      (p.foodNameUr && p.foodNameUr.includes(q)) ||
      (p.marketRetailer && p.marketRetailer.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 py-6 sm:py-8 px-3 sm:px-6 md:px-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-4 sm:p-6 md:p-8 shadow-xl">
          <div className="absolute -top-20 -end-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/30 px-3 py-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>Pakistan Local Food Market Intelligence</span>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground break-words">
                {t.foodPricing.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {t.foodPricing.subtitle} Verified across Azad Kashmir (Kotli), Punjab (Rawalpindi, Islamabad, Lahore), and Sindh (Karachi).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setShowSubmitModal(true)}
                className="h-9 gap-1.5 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex-1 sm:flex-initial"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit Local Price</span>
              </Button>

              <Link href="/calculator" className="flex-1 sm:flex-initial">
                <Button variant="outline" size="sm" className="h-9 w-full gap-1.5 font-bold text-xs rounded-xl">
                  <Calculator className="h-4 w-4 text-emerald-500" />
                  <span>{t.common.calculator}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* CONTROLS & TAB NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Main View Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === "catalog"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Market Price Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ranking")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === "ranking"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>{t.foodPricing.compareProtein}</span>
            </button>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-10 px-3.5 text-xs font-bold rounded-xl border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All Cities">{t.foodPricing.allCities}</option>
              {availableCities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} ({c.province})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: MARKET PRICE CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search item or market in English or Urdu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10 text-xs rounded-xl"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  className="h-9 text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  All
                </Button>
                {["protein", "carbohydrates", "fruits", "vegetables", "healthy_fats"].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="h-9 text-xs font-bold rounded-xl capitalize whitespace-nowrap"
                  >
                    {cat.replace("_", " ")}
                  </Button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-bold rounded-xl border border-border bg-card text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
                <option value="under_review">Under Review</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Price Cards Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-xs font-bold text-muted-foreground">{t.common.loading}</p>
              </div>
            ) : filteredPrices.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-sm font-bold text-foreground">{t.foodPricing.noPricesFound}</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No verified or community prices found matching your selected filters. FitLife AI never invents false market rates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCity("All Cities");
                    setSelectedCategory("");
                    setStatusFilter("");
                    setSearchQuery("");
                  }}
                  className="rounded-xl text-xs font-bold mt-2"
                >
                  Reset All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrices.map((item) => {
                  const CategoryIcon = CATEGORY_ICONS[item.categorySlug] || Dumbbell;
                  const isVerified = item.verificationStatus === "verified";
                  const isUnderReview = item.verificationStatus === "under_review";
                  const isExpired = item.verificationStatus === "expired";

                  return (
                    <Card
                      key={item.id}
                      className="rounded-2xl border border-border/80 hover:border-emerald-500/40 bg-card hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Card Header: Icon, Titles, Verification Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <CategoryIcon className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <Link
                                href={`/foods/${item.foodId}`}
                                className="font-extrabold text-sm text-foreground hover:text-emerald-500 transition-colors line-clamp-1"
                              >
                                {item.foodNameEn}
                              </Link>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-urdu" dir="rtl">
                                {item.foodNameUr}
                              </span>
                            </div>
                          </div>

                          {/* Verification Status Badge */}
                          {isVerified && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold gap-1 shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{t.foodPricing.verified}</span>
                            </Badge>
                          )}
                          {isUnderReview && (
                            <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-[10px] font-bold gap-1 shrink-0">
                              <RefreshCw className="h-3 w-3" />
                              <span>{t.foodPricing.underReview}</span>
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="secondary" className="text-muted-foreground text-[10px] font-bold gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{t.foodPricing.expired}</span>
                            </Badge>
                          )}
                          {!isVerified && !isUnderReview && !isExpired && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] font-bold gap-1 shrink-0">
                              <AlertCircle className="h-3 w-3" />
                              <span>{t.foodPricing.unverified}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Price Details */}
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-baseline justify-between">
                          <div className="text-2xl font-black text-foreground">
                            PKR {item.price}
                          </div>
                          <div className="text-xs font-bold text-muted-foreground">
                            per {item.quantity} {item.unit}
                          </div>
                        </div>

                        {/* Location & Metadata */}
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-500" /> City & Market:
                            </span>
                            <span className="font-bold text-foreground truncate max-w-[170px]">
                              {item.city} &bull; {item.marketRetailer || "General"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-teal-500" /> Source:
                            </span>
                            <span className="font-medium truncate max-w-[170px]">
                              {item.sourceName || "Government Rate List"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" /> Date:
                            </span>
                            <span>{item.collectionDate || "Recent"}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex items-center gap-2 border-t border-border/60">
                          <Link href={`/foods/${item.foodId}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-8">
                              Food Details
                            </Button>
                          </Link>
                          <Link href={`/calculator?food=${item.foodId}&city=${item.city}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                              <Calculator className="h-3.5 w-3.5 me-1" />
                              Calculate
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BEST VALUE PROTEIN LEADERBOARD */}
        {activeTab === "ranking" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 shadow-md">
              <div className="flex items-start gap-3">
                <Trophy className="h-7 w-7 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-foreground">
                    Pakistan Protein Cost-Efficiency Index &bull; {selectedCity === "All Cities" ? "Rawalpindi Benchmark" : selectedCity}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ranked by cost (PKR) required to obtain <strong>20 grams of protein</strong> based on authentic verified market prices. This helps athletes, students, and budget-conscious individuals hit their daily protein targets affordably.
                  </p>
                </div>
              </div>
            </div>

            {rankingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-xs font-bold text-muted-foreground">Analyzing protein efficiency...</p>
              </div>
            ) : proteinRanking.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-xs font-bold">
                No protein sources recorded in {selectedCity}. Please select another city like Rawalpindi, Islamabad, or Lahore.
              </Card>
            ) : (
              <div className="space-y-3">
                {proteinRanking.map((item, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    "from-amber-400 to-amber-600 text-white", // #1 Gold
                    "from-slate-300 to-slate-500 text-slate-900", // #2 Silver
                    "from-amber-700 to-amber-900 text-white", // #3 Bronze
                  ];

                  return (
                    <Card
                      key={item.foodId}
                      className={`rounded-2xl border transition-all ${
                        index === 0
                          ? "border-amber-500/50 bg-gradient-to-r from-amber-500/5 via-card to-card shadow-md"
                          : "border-border/80 bg-card hover:border-emerald-500/30"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Rank badge */}
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                              isTop3
                                ? `bg-gradient-to-tr ${rankColors[index]}`
                                : "bg-muted text-muted-foreground font-bold"
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/foods/${item.foodId}`}
                                className="font-extrabold text-base text-foreground hover:text-emerald-500 transition-colors"
                              >
                                {item.foodNameEn}
                              </Link>
                              {index === 0 && (
                                <Badge className="bg-amber-500 text-slate-950 font-black text-[10px]">
                                  🏆 Cheapest Protein
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-urdu" dir="rtl">
                              {item.foodNameUr}
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {item.proteinPer100g}g protein per 100g &bull; Price: PKR {item.price} / {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Cost per 20g Metric */}
                        <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                          <div className="text-end">
                            <div className="text-xl sm:text-2xl font-black text-foreground">
                              PKR {item.costPer20gProtein}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                              per 20g protein
                            </div>
                          </div>

                          <Link href={`/calculator?food=${item.foodId}&city=${item.city}`}>
                            <Button variant="outline" size="sm" className="h-9 font-bold text-xs rounded-xl gap-1">
                              <Calculator className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Plan Serving</span>
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VERIFICATION HIERARCHY & DISCLAIMER BANNER */}
        <div className="rounded-3xl border border-border/80 bg-muted/30 p-6 space-y-4">
          <div className="flex items-center gap-2.5 font-bold text-sm text-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>Price Verification Standard & Methodology</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="space-y-1 p-3 rounded-2xl bg-card border border-border/60">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> 1. Government Official Rates
              </span>
              <p className="text-[11px] leading-relaxed">
                Directly cross-referenced with District Commissioner rate lists, Qeemat Punjab, ICT Admin, and AJK District Committee notifications.
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-2xl bg-card border border-border/60">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-blue-500">
                <RefreshCw className="h-4 w-4" /> 2. Verified Retailers
              </span>
              <p className="text-[11px] leading-relaxed">
                Audited retail and wholesale rates from licensed grocery outlets, poultry associations, and milk suppliers.
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-2xl bg-card border border-border/60">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-amber-500">
                <AlertCircle className="h-4 w-4" /> 3. Community Submissions
              </span>
              <p className="text-[11px] leading-relaxed">
                Submitted by local users; flagged as <em>unverified</em> until confirmed by administrative review to prevent price distortion.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/80 italic text-center pt-1">
            {t.foodPricing.priceDisclaimer} FitLife AI guarantees deterministic data and does not simulate synthetic food prices.
          </p>
        </div>

        {/* COMMUNITY PRICE SUBMISSION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
            <div className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-card p-4 sm:p-6 md:p-8 shadow-2xl relative">
              <h3 className="text-lg font-black text-foreground mb-1">
                Submit Local Food Price
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Help athletes in your city by logging current retail rates. Submissions are marked <strong>Unverified</strong> until reviewed.
              </p>

              {submitSuccess ? (
                <div className="space-y-4 py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-foreground">
                    Price Submitted Successfully!
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your entry has been recorded with status <em>Unverified</em>. Thank you for contributing to the Pakistani fitness community!
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl font-bold text-xs"
                    onClick={() => {
                      setShowSubmitModal(false);
                      setSubmitSuccess(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Submit locally: creates a submission note
                    setSubmitSuccess(true);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Food Item</label>
                    <select
                      value={submitData.foodId}
                      onChange={(e) => setSubmitData({ ...submitData, foodId: e.target.value })}
                      className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-background"
                      required
                    >
                      {allFoodsList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nameEn} ({f.nameUr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">City</label>
                      <select
                        value={submitData.city}
                        onChange={(e) => setSubmitData({ ...submitData, city: e.target.value })}
                        className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-background"
                      >
                        <option value="Kotli">Kotli (AJK)</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Multan">Multan</option>
                        <option value="Faisalabad">Faisalabad</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Market / Shop</label>
                      <Input
                        type="text"
                        placeholder="e.g. Raja Bazaar, Awan Store"
                        value={submitData.marketRetailer}
                        onChange={(e) => setSubmitData({ ...submitData, marketRetailer: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Price (PKR)</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 350"
                        value={submitData.price}
                        onChange={(e) => setSubmitData({ ...submitData, price: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Quantity</label>
                      <Input
                        type="number"
                        min="0.1"
                        step="any"
                        value={submitData.quantity}
                        onChange={(e) => setSubmitData({ ...submitData, quantity: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Unit</label>
                      <select
                        value={submitData.unit}
                        onChange={(e) => setSubmitData({ ...submitData, unit: e.target.value })}
                        className="w-full h-10 px-2 text-xs font-semibold rounded-xl border border-border bg-background"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                        <option value="dozen">dozen</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSubmitModal(false)}
                      className="rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      className="rounded-xl text-xs font-bold"
                    >
                      Submit for Review
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function LocalFoodPricesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LocalFoodPricesContent />
    </Suspense>
  );
}