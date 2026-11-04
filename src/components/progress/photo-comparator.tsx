"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Calendar, Scale, Sparkles } from "lucide-react";

interface PhotoItem {
  id: string;
  photoDate: string;
  viewAngle: string;
  weightKg?: number | null;
  fileUrl: string;
  notes?: string | null;
}

interface PhotoComparatorProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  isRtl?: boolean;
}

export function PhotoComparator({
  isOpen,
  onClose,
  photos,
  isRtl = false,
}: PhotoComparatorProps) {
  const [photoAIndex, setPhotoAIndex] = useState<number>(
    photos.length > 1 ? photos.length - 1 : 0
  );
  const [photoBIndex, setPhotoBIndex] = useState<number>(0);

  if (!isOpen) return null;

  if (photos.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {isRtl ? "کم از کم 2 تصاویر درکار ہیں" : "Need at least 2 photos"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {isRtl
              ? "پہلے اور بعد کا موازنہ دیکھنے کے لیے مختلف تاریخوں کی کم از کم 2 تصاویر اپ لوڈ کریں۔"
              : "Upload at least two transformation photos from different dates to compare your progress."}
          </p>
          <Button onClick={onClose} className="w-full text-xs font-bold rounded-xl">
            {isRtl ? "سمجھ گیا" : "Understood"}
          </Button>
        </div>
      </div>
    );
  }

  const photoA = photos[photoAIndex] || photos[photos.length - 1];
  const photoB = photos[photoBIndex] || photos[0];

  const dateA = new Date(photoA.photoDate);
  const dateB = new Date(photoB.photoDate);
  const daysDiff = Math.abs(Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24)));

  let weightDeltaKg: number | null = null;
  if (photoA.weightKg && photoB.weightKg) {
    weightDeltaKg = Math.round((photoB.weightKg - photoA.weightKg) * 10) / 10;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-[calc(100vw-1.5rem)] max-w-4xl rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xl relative text-start max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/60 pb-4 pe-8">
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {isRtl ? "پہلے اور بعد کا تصویری موازنہ" : "Before & After Visual Comparison"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRtl ? "کسی بھی دو تصاویر کا بالمشافہ موازنہ کریں" : "Side-by-side transformation checkpoint"}
            </p>
          </div>

          {/* Stats Pill */}
          <div className="flex items-center gap-3 bg-muted/40 border border-border/60 rounded-2xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Calendar className="h-3.5 w-3.5 text-cyan-500" />
              <span>{daysDiff} {isRtl ? "دن کا فرق" : "days elapsed"}</span>
            </div>
            {weightDeltaKg !== null && (
              <div className="flex items-center gap-1.5 border-s border-border ps-3 font-bold text-emerald-500">
                <Scale className="h-3.5 w-3.5" />
                <span>
                  {weightDeltaKg > 0 ? `+${weightDeltaKg}` : weightDeltaKg} kg
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side by Side Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Photo A (Before) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isRtl ? "تصویر الف (پہلے)" : "Photo A (Before)"}
              </span>
              <select
                value={photoAIndex}
                onChange={(e) => setPhotoAIndex(parseInt(e.target.value))}
                className="text-xs rounded-lg border border-border bg-background px-2 py-1 font-medium"
              >
                {photos.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.photoDate.split("T")[0]} ({p.viewAngle})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative rounded-2xl border border-border overflow-hidden bg-slate-950 h-80 sm:h-96 flex items-center justify-center">
              <img
                src={photoA.fileUrl}
                alt="Before"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 start-2 bg-black/75 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-2 font-medium">
                <span>{photoA.photoDate.split("T")[0]}</span>
                {photoA.weightKg && (
                  <span className="text-emerald-400 font-bold">
                    {photoA.weightKg} kg
                  </span>
                )}
                <span className="uppercase text-[9px] bg-white/20 px-1.5 py-0.5 rounded">
                  {photoA.viewAngle}
                </span>
              </div>
            </div>

            {photoA.notes && (
              <p className="text-xs text-muted-foreground italic px-1">
                "{photoA.notes}"
              </p>
            )}
          </div>

          {/* Photo B (After) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                {isRtl ? "تصویر ب (بعد میں)" : "Photo B (After)"}
              </span>
              <select
                value={photoBIndex}
                onChange={(e) => setPhotoBIndex(parseInt(e.target.value))}
                className="text-xs rounded-lg border border-border bg-background px-2 py-1 font-medium"
              >
                {photos.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.photoDate.split("T")[0]} ({p.viewAngle})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative rounded-2xl border border-emerald-500/40 overflow-hidden bg-slate-950 h-80 sm:h-96 flex items-center justify-center">
              <img
                src={photoB.fileUrl}
                alt="After"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 start-2 bg-black/75 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-2 font-medium">
                <span>{photoB.photoDate.split("T")[0]}</span>
                {photoB.weightKg && (
                  <span className="text-emerald-400 font-bold">
                    {photoB.weightKg} kg
                  </span>
                )}
                <span className="uppercase text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                  {photoB.viewAngle}
                </span>
              </div>
            </div>

            {photoB.notes && (
              <p className="text-xs text-muted-foreground italic px-1">
                "{photoB.notes}"
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border/60 flex justify-end">
          <Button onClick={onClose} variant="outline" className="text-xs rounded-xl h-9">
            {isRtl ? "بند کریں" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}

