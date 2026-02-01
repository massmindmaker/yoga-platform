"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, Wallet, CreditCard } from "lucide-react";

const recentPayments = [
  { id: "1", student: "Анна Морозова", amount: 4500, date: "30.01.2026" },
  { id: "2", student: "Мария Козлова", amount: 8500, date: "30.01.2026" },
  { id: "3", student: "Елена Соколова", amount: 4500, date: "29.01.2026" },
  { id: "4", student: "Ольга Петрова", amount: 12000, date: "28.01.2026" },
  { id: "5", student: "Наталья Иванова", amount: 4500, date: "27.01.2026" },
];

const weeklyStats = [
  { day: "Пн", amount: 12500 },
  { day: "Вт", amount: 18200 },
  { day: "Ср", amount: 15800 },
  { day: "Чт", amount: 22400 },
  { day: "Пт", amount: 28900 },
  { day: "Сб", amount: 31200 },
  { day: "Вс", amount: 25600 },
];

export default function TrainerPaymentsPage() {
  const totalWeek = weeklyStats.reduce((sum, s) => sum + s.amount, 0);
  const totalToday = recentPayments
    .filter(p => p.date === "30.01.2026")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Платежи" />

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-500">За неделю</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalWeek.toLocaleString()} ₽
              </p>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+12%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-500">Сегодня</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalToday.toLocaleString()} ₽
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>{recentPayments.filter(p => p.date === "30.01.2026").length} платежей</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Последние платежи</h2>

          <div className="space-y-3">
            {recentPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                            {payment.student.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{payment.student}</p>
                          <p className="text-sm text-gray-500">{payment.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{payment.amount.toLocaleString()} ₽
                        </p>
                        <p className="text-xs text-gray-500">Банковская карта</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
