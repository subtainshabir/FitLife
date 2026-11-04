"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Scale, Loader2, Calendar } from "lucide-react";

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    weightKg: number;
    unit: string;
    notes?: string | null;
    recordedAt?: string;
  } | null;
  isRtl?: boolean;
}

export function LogWeightModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isRtl = false,
}: LogWeightModalProps) {
  const [weight, setWeight] = useState<string>(
    initialData ? initialData.weightKg.toString() : ""
  );
  const [unit, setUnit] = useState<"kg" | "lbs">((initialData?.unit as "kg" | "lbs") || "kg");
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [date, setDate] = useState<string>(
    initialData?.recordedAt ? initialData.recordedAt.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weight);
    if (isNaN(val) || val <= 0 || val > 500) {
      setError(isRtl ? "براہ کرم درست وزن درج کریں۔" : "Please enter a valid weight between 1 and 500.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = initialData?.id
        ? `/api/v1/progress/weight/${initialData.id}`
        : "/api/v1/progress/weight";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: val,
          unit,
          notes: notes.trim() || undefined,
          recordedAt: new Date(date).toISOString(),
          updateProfileCurrentWeight: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save weight.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-2xl relative text-start max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              {initialData?.id
                ? (isRtl ? "وزن میں ترمیم کریں" : "Edit Weight Entry")
                : (isRtl ? "نیا وزن ریکارڈ کریں" : "Log New Weight")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRtl ? "اپنا موجودہ وزن درج کریں" : "Track your body weight progress"}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 mb-4 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weight & Unit Selector */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              {isRtl ? "وزن:" : "Weight:"}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 74.5"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <div className="flex rounded-xl border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    unit === "kg"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("lbs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    unit === "lbs"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              {isRtl ? "تاریخ:" : "Date:"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              {isRtl ? "اضافی نوٹس (اختیاری):" : "Notes (Optional):"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? "مثال: صبح نہار منہ وزن کیا گیا" : "e.g., Morning weighed after fasting"}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl text-xs h-10"
            >
              {isRtl ? "منسوخ" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl text-xs h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : initialData?.id ? (
                isRtl ? "محفوظ کریں" : "Update Entry"
              ) : (
                isRtl ? "وزن محفوظ کریں" : "Save Weight"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

