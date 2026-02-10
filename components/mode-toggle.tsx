"use client";

import { motion } from "framer-motion";
import { GraduationCap, Dumbbell } from "lucide-react";
import { useMode } from "@/src/hooks/use-mode";

export function ModeToggle() {
  const { mode, toggleMode } = useMode();

  return (
    <motion.button
      onClick={toggleMode}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border-2 transition-colors"
      style={{
        backgroundColor: mode === "student" ? "#111827" : "#000000",
        borderColor: mode === "student" ? "#374151" : "#1F2937",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {mode === "student" ? (
        <>
          <GraduationCap className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Ученик</span>
        </>
      ) : (
        <>
          <Dumbbell className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Тренер</span>
        </>
      )}
    </motion.button>
  );
}
