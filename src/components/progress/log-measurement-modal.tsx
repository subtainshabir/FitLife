"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Ruler, Loader2 } from "lucide-react";

interface LogMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
  isRtl?: boolean;
}

export function LogMeasurementModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isRtl = false,
}: LogMeasurementModalProps) {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">(
    initialData?.unitSystem || "metric"
  );
  const [waist, setWaist] = useState<string>(
    initialData?.waistCm ? (unitSystem === "imperial" ? (Math.round((initialData.waistCm / 2.54) * 10) / 10).toString() : initialData.waistCm.toString()) : ""
  );
  const [chest, setChest] = useState<string>(
    initialData?.chestCm ? (unitSystem === "imperial" ? (Math.round((initialData.chestCm / 2.54) * 10) / 10).toString() : initialData.chestCm.toString()) : ""
  );
  const [hip, setHip] = useState<string>(
    initialData?.hipCm ? (unitSystem === "imperial" ? (Math.round((initialData.hipCm / 2.54) * 10) / 10).toString() : initialData.hipCm.toString()) : ""
  );
  const [arm, setArm] = useState<string>(
    initialData?.armCm ? (unitSystem === "imperial" ? (Math.round((initialData.armCm / 2.54) * 10) / 10).toString() : initialData.armCm.toString()) : ""
  );
  const [thigh, setThigh] = useState<string>(
    initialData?.thighCm ? (unitSystem === "imperial" ? (Math.round((initialData.thighCm / 2.54) * 10) / 10).toString() : initialData.thighCm.toString()) : ""
  );
  const [neck, setNeck] = useState<string>(
    initialData?.neckCm ? (unitSystem === "imperial" ? (Math.round((initialData.neckCm / 2.54) * 10) / 10).toString() : initialData.neckCm.toString()) : ""
  );
  const [forearm, setForearm] = useState<string>(
    initialData?.forearmCm ? (unitSystem === "imperial" ? (Math.round((initialData.forearmCm / 2.54) * 10) / 10).toString() : initialData.forearmCm.toString()) : ""
  );
  const [calf, setCalf] = useState<string>(
    initialData?.calfCm ? (unitSystem === "imperial" ? (Math.round((initialData.calfCm / 2.54) * 10) / 10).toString() : initialData.calfCm.toString()) : ""
  );
  const [bodyFat, setBodyFat] = useState<string>(
    initialData?.bodyFatPercentage ? initialData.bodyFatPercentage.toString() : ""
  );
  const [weight, setWeight] = useState<string>(
    initialData?.weightKg ? (unitSystem === "imperial" ? (Math.round(initialData.weightKg * 2.20462 * 10) / 10).toString() : initialData.weightKg.toString()) : ""
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [date, setDate] = useState<string>(
    initialData?.recordedAt ? initialData.recordedAt.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseOrUndefined = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      unitSystem,
      waist: parseOrUndefined(waist),
      chest: parseOrUndefined(chest),
      hip: parseOrUndefined(hip),
      arm: parseOrUndefined(arm),
      thigh: parseOrUndefined(thigh),
      neck: parseOrUndefined(neck),
      forearm: parseOrUndefined(forearm),
      calf: parseOrUndefined(calf),
      bodyFatPercentage: parseOrUndefined(bodyFat),
      weight: parseOrUndefined(weight),
      notes: notes.trim() || undefined,
      recordedAt: new Date(date).toISOString(),
    };

    const hasAnyField = Object.entries(payload).some(
      ([key, val]) => !["unitSystem", "recordedAt"].includes(key) && val !== undefined
    );

    if (!hasAnyField) {
      setError(isRtl ? "براہ کرم کم از کم ایک پیمائش یا نوٹ درج کریں۔" : "Please provide at least one measurement or note.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = initialData?.id
        ? `/api/v1/progress/measurements/${initialData.id}`
        : "/api/v1/progress/measurements";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save measurements.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const lengthUnit = unitSystem === "imperial" ? "in" : "cm";
  const weightUnit = unitSystem === "imperial" ? "lbs" : "kg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-[calc(100vw-2rem)] max-w-xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl relative text-start max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between gap-3 mb-5 pe-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {initialData?.id
                  ? (isRtl ? "پیمائش میں ترمیم کریں" : "Edit Body Measurements")
                  : (isRtl ? "جسمانی پیمائشیں درج کریں" : "Record Body Measurements")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "صرف وہی پیمائشیں درج کریں جو آپ ٹریک کرنا چاہتے ہیں" : "Log the circumferences you care about"}
              </p>
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="flex rounded-xl border border-border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setUnitSystem("metric")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                unitSystem === "metric"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Metric (cm)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem("imperial")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                unitSystem === "imperial"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Imperial (in)
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 mb-4 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Optional Weight Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                {isRtl ? "تاریخ:" : "Date:"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                {isRtl ? "وزن (اختیاری):" : `Weight (${weightUnit}):`}
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`e.g. ${unitSystem === "imperial" ? "165" : "75"}`}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
              />
            </div>
          </div>

          {/* Primary Circumferences Grid */}
          <div className="border-t border-border/60 pt-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              {isRtl ? "اہم جسمانی پیمائشیں" : "Key Circumferences"} ({lengthUnit})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "کمر (Waist):" : "Waist:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder={`e.g. ${unitSystem === "imperial" ? "32" : "82"}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "سینہ (Chest):" : "Chest:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="40"
                  max="250"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder={`e.g. ${unitSystem === "imperial" ? "40" : "102"}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "کولہے (Hips):" : "Hips:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="40"
                  max="250"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  placeholder={`e.g. ${unitSystem === "imperial" ? "38" : "96"}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "بازو (Arms):" : "Arms (Bicep):"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="100"
                  value={arm}
                  onChange={(e) => setArm(e.target.value)}
                  placeholder={`e.g. ${unitSystem === "imperial" ? "14" : "36"}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "رانیں (Thighs):" : "Thighs:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="150"
                  value={thigh}
                  onChange={(e) => setThigh(e.target.value)}
                  placeholder={`e.g. ${unitSystem === "imperial" ? "22" : "56"}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "چربی % (Body Fat):" : "Body Fat %:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="e.g. 15.5"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Secondary Measurements Grid */}
          <div className="border-t border-border/60 pt-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              {isRtl ? "دیگر پیمائشیں" : "Additional Measurements"} ({lengthUnit})
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "گردن (Neck):" : "Neck:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  placeholder="e.g. 38"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "کلائی (Forearms):" : "Forearms:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={forearm}
                  onChange={(e) => setForearm(e.target.value)}
                  placeholder="e.g. 29"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRtl ? "پنڈلیاں (Calves):" : "Calves:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calf}
                  onChange={(e) => setCalf(e.target.value)}
                  placeholder="e.g. 37"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              {isRtl ? "اضافی نوٹس:" : "Notes:"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? "مثال: صبح نہار منہ پیمائش کی گئی" : "e.g., Morning tape measurement"}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              className="flex-1 rounded-xl text-xs h-10 bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : initialData?.id ? (
                isRtl ? "محفوظ کریں" : "Update Measurements"
              ) : (
                isRtl ? "پیمائش محفوظ کریں" : "Save Measurements"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
