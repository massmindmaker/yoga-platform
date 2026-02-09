"use client";

import { useMode } from "@/src/hooks/use-mode";
import { ModeToggle } from "@/components/mode-toggle";

// Import actual page components + layouts
import StudentMainPage from "@/app/(student)/page";
import StudentLayout from "@/app/(student)/layout";
import TrainerDashboard from "@/app/(trainer)/dashboard/page";
import TrainerLayout from "@/app/(trainer)/layout";

// Main Mode Router
export function ModeRouter() {
  const { mode } = useMode();

  return (
    <>
      <ModeToggle />
      {mode === "student" ? (
        <StudentLayout>
          <StudentMainPage />
        </StudentLayout>
      ) : (
        <TrainerLayout>
          <TrainerDashboard />
        </TrainerLayout>
      )}
    </>
  );
}
