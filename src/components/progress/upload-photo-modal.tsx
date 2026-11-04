"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Upload, Shield, Loader2, Lock } from "lucide-react";

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRtl?: boolean;
}

export function UploadPhotoModal({
  isOpen,
  onClose,
  onSuccess,
  isRtl = false,
}: UploadPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewAngle, setViewAngle] = useState<"front" | "side" | "back" | "other">("front");
  const [photoDate, setPhotoDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [weightKg, setWeightKg] = useState<string>("");
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError(isRtl ? "صرف JPEG، PNG یا WebP فارمیٹ سپورٹڈ ہیں۔" : "Only JPEG, PNG, or WebP files are supported.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError(isRtl ? "تصویر کا سائز 5MB سے کم ہونا چاہیے۔" : "File size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(isRtl ? "براہ کرم تصویر منتخب کریں۔" : "Please select an image file to upload.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("viewAngle", viewAngle);
      formData.append("photoDate", new Date(photoDate).toISOString());
      if (weightKg) formData.append("weightKg", weightKg);
      formData.append("isHidden", isHidden ? "true" : "false");
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await fetch("/api/v1/progress/photos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload photo.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to upload photo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl relative text-start max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              {isRtl ? "تبدیلی کی تصویر اپ لوڈ کریں" : "Upload Transformation Photo"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRtl ? "نجی تصویر صرف آپ کے لیے محفوظ رہے گی" : "Private photo journal entry"}
            </p>
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 mb-4 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <Lock className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">
              {isRtl ? "100% نجی اور محفوظ اسٹوریج" : "100% Private & Protected Storage"}
            </span>
            <p className="text-[11px] opacity-90">
              {isRtl
                ? "آپ کی تصاویر صرف آپ ہی دیکھ سکتے ہیں۔ وہ کبھی عوامی نہیں ہوتیں اور نہ ہی AI ماڈل ٹریننگ کے لیے استعمال کی جاتی ہیں۔"
                : "Photos are stored in private local storage and accessed only via authorized sessions. Never shared or used for AI training."}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 mb-4 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Selector / Drag drop area */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative rounded-2xl border border-border overflow-hidden h-48 bg-muted flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 end-2 bg-black/60 text-white p-1 rounded-full hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-border hover:border-amber-500/50 bg-muted/20 p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-muted/40 text-center"
              >
                <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  {isRtl ? "تصویر منتخب کرنے کے لیے یہاں کلک کریں" : "Click to select a photo"}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  JPEG, PNG, WebP (Max 5MB)
                </span>
              </div>
            )}
          </div>

          {/* Angle Selector */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              {isRtl ? "زاویہ (View Angle):" : "Pose / Angle:"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "front", labelEn: "Front", labelUr: "سامنے" },
                { key: "side", labelEn: "Side", labelUr: "پہلو" },
                { key: "back", labelEn: "Back", labelUr: "پیچھے" },
                { key: "other", labelEn: "Other", labelUr: "دیگر" },
              ].map((ang) => (
                <button
                  key={ang.key}
                  type="button"
                  onClick={() => setViewAngle(ang.key as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    viewAngle === ang.key
                      ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {isRtl ? ang.labelUr : ang.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Weight Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                {isRtl ? "تاریخ:" : "Photo Date:"}
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                {isRtl ? "وزن (kg - اختیاری):" : "Weight (kg - optional):"}
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 74.0"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              {isRtl ? "نوٹس (اختیاری):" : "Notes (Optional):"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? "مثال: 60 دن کے بعد کی تصویر" : "e.g., Week 8 progress checkpoint"}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Privacy Toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
              className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-muted-foreground">
              {isRtl ? "ڈیش بورڈ کے فوری ویو سے مخفی رکھیں (صرف جرنل میں نظر آئے)" : "Hide from main dashboard preview (only visible in Photo Journal)"}
            </span>
          </label>

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
              className="flex-1 rounded-xl text-xs h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isRtl ? "تصویر اپ لوڈ کریں" : "Upload Photo"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
