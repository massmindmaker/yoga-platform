"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/subscription/balance-card";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function MainPage() {
  const [userName, setUserName] = useState("Студент");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Try to get user info from Telegram WebApp
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
      setUserName(tgUser.first_name || "Студент");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF9] via-white to-[#F8FAFC]">
      <PageHeader title="Yoga Studio" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-r from-[#3BCEAC] via-[#2DD4BF] to-[#14B8A6] rounded-2xl p-6 text-white shadow-xl shadow-[#3BCEAC]/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white/80 text-sm font-medium">Добро пожаловать</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{userName} 👋</h1>
          <p className="text-white/80">Готовы к практике сегодня?</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={itemVariants}>
          <BalanceCard
            balance={balance}
            totalClasses={0}
            usedClasses={0}
          />
        </motion.div>

        {/* Upcoming Classes — empty state (real data from DB) */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Ближайшие занятия
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-purple-600 flex items-center hover:text-purple-700 font-medium"
            >
              Все
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-600 mb-4 font-medium">У вас нет предстоящих занятий</p>
              <Link href="/schedule">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-200">
                  Записаться
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
