"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight, CreditCard, Download, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";

// Mock платежи
const payments = [
  { id: "1", date: "30.01.2026", amount: 4500, description: "4 занятия", type: "purchase", status: "completed" },
  { id: "2", date: "15.01.2026", amount: 8500, description: "8 занятий", type: "purchase", status: "completed" },
  { id: "3", date: "20.12.2025", amount: 12000, description: "12 занятий", type: "purchase", status: "completed" },
  { id: "4", date: "05.12.2025", amount: 1500, description: "Разовое занятие", type: "purchase", status: "completed" },
];

const stats = {
  totalSpent: 26500,
  totalClasses: 25,
  avgPrice: 1060,
  lastPayment: "30.01.2026",
};

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

export default function StudentPaymentsPage() {
  const currentBalance: number = 5;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Платежи" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Карточка баланса */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-white/80" />
                      <span className="text-white/80 text-sm">Текущий баланс</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{currentBalance}</span>
                      <span className="text-xl text-white/80">
                        {currentBalance === 1 ? "занятие" : currentBalance <= 4 ? "занятия" : "занятий"}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-white">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500">Потрачено</span>
                  </div>
                  <p className="font-bold text-gray-900">{stats.totalSpent.toLocaleString()} ₽</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">Куплено</span>
                  </div>
                  <p className="font-bold text-gray-900">{stats.totalClasses} занятий</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">Средняя цена</span>
                  </div>
                  <p className="font-bold text-gray-900">{stats.avgPrice} ₽</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* История платежей */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">История платежей</h2>
            <Button variant="ghost" size="sm" className="text-purple-600">
              <Download className="w-4 h-4 mr-1" />
              Экспорт
            </Button>
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                variants={itemVariants}
                custom={index}
                whileHover={{ x: 4 }}
                className="cursor-pointer"
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payment.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">{payment.date}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              Оплачено
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 text-lg">
                          {payment.amount.toLocaleString()} ₽
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Пустое состояние, если нет платежей */}
        {payments.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Нет платежей</h3>
            <p className="text-gray-500 mb-4">Вы еще не совершали покупок</p>
          </motion.div>
        )}
      </motion.div>

      {/* Фиксированная кнопка покупки */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 left-4 right-4 z-40"
      >
        <Link href="/purchase">
          <Button className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white h-14 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all">
            Купить занятия
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
