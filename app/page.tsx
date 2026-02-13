"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Dumbbell } from "lucide-react";
import StudentMainPage from "@/app/(student)/page";
import StudentLayout from "@/app/(student)/layout";
import TrainerDashboard from "@/app/(trainer)/dashboard/page";
import TrainerLayout from "@/app/(trainer)/layout";

type UserRole = "student" | "trainer";

export default function Home() {
  const [role, setRole] = useState<UserRole>("student");

  const toggleRole = () => {
    setRole((prev) => (prev === "student" ? "trainer" : "student"));
  };

  return (
    <div className="relative">
      {/* Role toggle button - floating */}
      <motion.button
        onClick={toggleRole}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {role === "student" ? (
          <>
            <User className="w-4 h-4" />
            <span>Ученик</span>
          </>
        ) : (
          <>
            <Dumbbell className="w-4 h-4" />
            <span>Тренер</span>
          </>
        )}
      </motion.button>

      {/* Content based on role */}
      {role === "student" ? (
        <StudentLayout>
          <StudentMainPage />
        </StudentLayout>
      ) : (
        <TrainerLayout>
          <TrainerDashboard />
        </TrainerLayout>
      )}
    </div>
  );
}
