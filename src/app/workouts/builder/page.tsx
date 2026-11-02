"use client";

import React from "react";
import { RoutineBuilderForm } from "@/components/workouts/routine-builder-form";

export default function NewRoutineBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <RoutineBuilderForm isEditing={false} />
    </div>
  );
}

