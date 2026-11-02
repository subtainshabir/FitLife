"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { ExerciseCard, ExerciseItemProps } from "@/components/exercises/exercise-card";
import {
  Dumbbell,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Compass,
  Layers,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from "lucide-react";

interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  icon: string;
  exerciseCount: number;
}

interface MuscleItem {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  bodyRegion: string;
  exerciseCount: number;
}

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl, language } = useI18n();

  const [loading, setLoading] = useState(true);
  const [exercisesList, setExercisesList] = useState<ExerciseItemProps[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [musclesList, setMusclesList] = useState<MuscleItem[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedMuscle, setSelectedMuscle] = useState(searchParams.get("muscle") || "all");
  const [selectedEquipment, setSelectedEquipment] = useState(searchParams.get("equipment") || "all");
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "all");
  const [isBodyweightOnly, setIsBodyweightOnly] = useState(searchParams.get("bodyweight") === "true");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  // Muscle Explorer Accordion / Drawer
  const [showMuscleExplorer, setShowMuscleExplorer] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catsRes, musclesRes] = await Promise.all([
          fetch("/api/v1/exercises/categories"),
          fetch("/api/v1/exercises/muscles"),
        ]);
        if (catsRes.ok) {
          const cData = await catsRes.json();
          setCategoriesList(cData.categories || []);
        }
        if (musclesRes.ok) {
          const mData = await musclesRes.json();
          setMusclesList(mData.muscles || []);
        }
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadExercises() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "12");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedMuscle !== "all") params.set("muscle", selectedMuscle);
        if (selectedEquipment !== "all") params.set("equipment", selectedEquipment);
        if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
        if (isBodyweightOnly) params.set("isBodyweight", "true");
        params.set("sortBy", sortBy);

        const res = await fetch(`/api/v1/exercises?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setExercisesList(data.exercises || []);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch exercises:", err);
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      loadExercises();
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [
    searchQuery,
    selectedCategory,
    selectedMuscle,
    selectedEquipment,
    selectedDifficulty,
    isBodyweightOnly,
    sortBy,
    page,
  ]);

  const handleMuscleClickFromMap = (muscleSlug: string) => {
    if (selectedMuscle === muscleSlug) {
      setSelectedMuscle("all");
    } else {
      setSelectedMuscle(muscleSlug);
      setPage(1);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedMuscle("all");
    setSelectedEquipment("all");
    setSelectedDifficulty("all");
    setIsBodyweightOnly(false);
    setSortBy("name");
    setPage(1);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedMuscle !== "all" ? 1 : 0) +
    (selectedEquipment !== "all" ? 1 : 0) +
    (selectedDifficulty !== "all" ? 1 : 0) +
    (isBodyweightOnly ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
      <DashboardNav />

      <main className="flex-1 pb-20 md:pb-12">
        {/* Header Hero Section */}
        <section className="border-b border-border/80 bg-gradient-to-b from-card/80 to-background/40 backdrop-blur-md py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    Phase 5 Live
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">
                    Biomechanical Motion & Anatomy Guides
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {language === "ur" ? "ورزشوں کی لائبریری اور تکنیک رہنمائی" : "Exercise Library & Visual Guides"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Explore 30+ medically verified movements with anatomical muscle maps, correct breathing cues, safety guidelines, and progression variations.
                </p>
              </div>

              {/* Muscle Explorer Drawer Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showMuscleExplorer ? "default" : "outline"}
                  onClick={() => setShowMuscleExplorer(!showMuscleExplorer)}
                  className="rounded-2xl text-xs font-bold gap-2 shadow-sm"
                >
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span>{showMuscleExplorer ? "Hide Muscle Map" : "Visual Muscle Explorer"}</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-6">
          {/* Interactive Muscle Explorer Drawer (When active) */}
          {showMuscleExplorer && (
            <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-card via-card to-emerald-950/10 p-5 sm:p-6 mb-8 shadow-md animate-in fade-in slide-in-from-top-3">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-md text-center lg:text-start">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-base font-black text-foreground">
                      Interactive Body Anatomy Explorer
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any highlighted muscle group to filter verified exercises targeting that specific region. Front and back anatomical views are mapped.
                  </p>

                  {/* Muscle Quick Pills */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-2">
                    {musclesList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMuscleClickFromMap(m.slug)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                          selectedMuscle === m.slug
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                            : "bg-muted/40 border-border/80 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
                        }`}
                      >
                        {m.nameEn.split(" ")[0]} ({m.exerciseCount})
                      </button>
                    ))}
                  </div>
                </div>

                {/* The Muscle Map Canvas */}
                <div className="p-3 bg-muted/20 rounded-3xl border border-border/60">
                  <MuscleMap
                    selectedMuscle={selectedMuscle !== "all" ? selectedMuscle : undefined}
                    onSelectMuscle={handleMuscleClickFromMap}
                    interactive={true}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Search Bar & Primary Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search exercises by English or Urdu name (e.g. Push-ups, بینچ پریس, Squats)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="ps-10 rounded-2xl h-11 text-xs border-border bg-card"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 px-3.5 rounded-2xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="name">Sort: A-Z (Alphabetical)</option>
                  <option value="difficulty">Sort: Difficulty Level</option>
                  <option value="calories">Sort: Highest Caloric Burn</option>
                  <option value="recent">Sort: Recently Added</option>
                </select>

                {activeFiltersCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="h-11 text-xs font-bold text-muted-foreground hover:text-destructive rounded-2xl gap-1 px-3"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Pills / Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Pills */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-emerald-500/40 hover:text-foreground"
                }`}
              >
                All Categories
              </button>

              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-emerald-500/40 hover:text-foreground"
                  }`}
                >
                  {cat.nameEn.split(" ")[0]} ({cat.exerciseCount})
                </button>
              ))}

              {/* Equipment Filter Dropdown */}
              <select
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="all">Equipment: All</option>
                <option value="none">No Equipment / Bodyweight</option>
                <option value="dumbbells">Dumbbells</option>
                <option value="barbell">Barbell</option>
                <option value="cable">Cable Machine</option>
                <option value="machine">Gym Machines</option>
                <option value="pull_up_bar">Pull-Up Bar</option>
                <option value="resistance_band">Resistance Band</option>
              </select>

              {/* Difficulty Filter Dropdown */}
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="all">Difficulty: All</option>
                <option value="beginner">Beginner-Friendly</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Bodyweight Toggle Chip */}
              <button
                type="button"
                onClick={() => {
                  setIsBodyweightOnly(!isBodyweightOnly);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  isBodyweightOnly
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Home / Bodyweight Only</span>
              </button>
            </div>
          </div>

          {/* Results Summary & Counter */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mt-6 mb-4">
            <div>
              Showing <strong className="text-foreground">{exercisesList.length}</strong> of{" "}
              <strong className="text-foreground">{pagination.total}</strong> verified movements
              {selectedMuscle !== "all" && (
                <span className="ms-1 text-emerald-600 dark:text-emerald-400 capitalize">
                  (Targeting {selectedMuscle})
                </span>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div>
                Page {pagination.page} of {pagination.totalPages}
              </div>
            )}
          </div>

          {/* Exercise Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">
                Loading anatomical movement guides...
              </p>
            </div>
          ) : exercisesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {exercisesList.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border border-border/80 bg-card p-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-foreground mb-1">
                No exercises matched your filters
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                Try widening your search terms or clearing your muscle and equipment filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="rounded-xl text-xs font-bold"
              >
                Clear All Filters
              </Button>
            </Card>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/60">
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="text-xs font-bold text-muted-foreground px-3">
                {pagination.page} / {pagination.totalPages}
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
