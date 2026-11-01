import React from "react";

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  circleClassName?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className = "",
  circleClassName = "text-primary",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
          fill="transparent"
        />
        {/* Animated Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${circleClassName} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {children}
        </div>
      )}
    </div>
  );
}

