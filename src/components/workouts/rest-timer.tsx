"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X, Plus, Minus, Volume2, VolumeX, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  exerciseName?: string;
}

export function RestTimer({
  initialSeconds = 60,
  isOpen,
  onClose,
  onComplete,
  exerciseName,
}: RestTimerProps) {
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Use wall-clock timestamp to prevent background tab drift
  const endTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const animationFrameRef = useRef<number | null>(null);

  // Play synthetic chime via Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";

      // Pleasant ascending double bell tone
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.25); // A6
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.start(now);
      osc.stop(now + 0.75);

      // Haptic feedback for mobile
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([150, 100, 250]);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Sync when initialSeconds or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTargetSeconds(initialSeconds);
      setSecondsRemaining(initialSeconds);
      setIsRunning(true);
      endTimeRef.current = Date.now() + initialSeconds * 1000;
    }
  }, [initialSeconds, isOpen]);

  // Ticking loop using Date.now()
  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = endTimeRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        playChime();
        onComplete?.();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, playChime, onComplete]);

  const togglePlayPause = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      endTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
    }
  };

  const addTime = (seconds: number) => {
    const newRemaining = Math.max(5, secondsRemaining + seconds);
    setSecondsRemaining(newRemaining);
    setTargetSeconds((prev) => Math.max(newRemaining, prev + seconds));
    endTimeRef.current = Date.now() + newRemaining * 1000;
  };

  const resetTimer = () => {
    setSecondsRemaining(targetSeconds);
    endTimeRef.current = Date.now() + targetSeconds * 1000;
    setIsRunning(true);
  };

  if (!isOpen) return null;

  // Circular progress calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = targetSeconds > 0 ? (targetSeconds - secondsRemaining) / targetSeconds : 1;
  const strokeDashoffset = circumference - progressPercent * circumference;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const displayTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isRunning ? "animate-ping bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isRunning ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Rest Timer
          </span>
          {exerciseName && (
            <span className="text-xs text-slate-400 truncate max-w-[130px]" title={exerciseName}>
              • {exerciseName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded p-1 text-slate-400 hover:text-white"
            title={soundEnabled ? "Mute chime" : "Enable chime"}
            aria-label={soundEnabled ? "Mute chime" : "Enable chime"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-red-400" />}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white"
            title="Dismiss rest timer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Circular Progress & Time Display */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            className="text-emerald-500 transition-all duration-200"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl font-extrabold tracking-tight text-white">
            {displayTime}
          </span>
          <span className="text-[11px] text-slate-400">
            {secondsRemaining === 0 ? "Time's Up!" : isRunning ? "Resting" : "Paused"}
          </span>
        </div>
      </div>

      {/* Quick Adjust Buttons */}
      <div className="flex items-center justify-center gap-2 my-3">
        <button
          onClick={() => addTime(-15)}
          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
        >
          -15s
        </button>
        <button
          onClick={() => addTime(30)}
          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
        >
          +30s
        </button>
        <button
          onClick={() => addTime(60)}
          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
        >
          +60s
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <Button
          size="sm"
          variant="outline"
          onClick={resetTimer}
          className="h-9 px-3 border-slate-700 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>

        <Button
          size="sm"
          onClick={togglePlayPause}
          className={`h-9 flex-1 text-xs font-semibold ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1" />
              Resume
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onComplete?.();
            onClose();
          }}
          className="h-9 px-3 bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

