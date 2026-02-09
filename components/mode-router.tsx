"use client";

import { motion } from "framer-motion";
import { useMode } from "@/src/hooks/use-mode";
import { ModeToggle } from "@/components/mode-toggle";

// Student components
import { PageHeader as StudentHeader } from "@/components/layout/page-header";
import { BottomNav as StudentNav } from "@/components/layout/bottom-nav";
import { BalanceCard } from "@/components/subscription/balance-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

// Trainer components  
import TrainerDashboard from "@/app/(trainer)/dashboard/page";
import TrainerLayout from "@/app/(trainer)/layout";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// Student Dashboard View
function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader title="Yoga Studio" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6 pb-24"
      >
        <motion.div variants={itemVariants}>
          <BalanceCard
            balance={0}
            totalClasses={0}
            usedClasses={0}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Ближайшие занятия</h2>
            <Link href="/schedule" className="text-sm text-[#3BCEAC] flex items-center">
              Все<ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#F0FDF9] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#2DD4BF]" />
              </div>
              <p className="text-gray-500 mb-4">У вас нет предстоящих занятий</p>
              <Link href="/schedule">
                <Button className="bg-[#3BCEAC] hover:bg-[#14B8A6]">Записаться</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <StudentNav />
    </div>
  );
}

// Main Mode Router
export function ModeRouter() {
  const { mode } = useMode();

  return (
    <>
      <ModeToggle />
      {mode === "student" ? (
        <StudentDashboard />
      ) : (
        <TrainerLayout>
          <TrainerDashboard />
        </TrainerLayout>
      )}
    </>
  );
}
