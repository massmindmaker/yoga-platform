"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Wallet } from "lucide-react";

const chartData = [
  { day: "Пн", revenue: 12500 },
  { day: "Вт", revenue: 18200 },
  { day: "Ср", revenue: 15800 },
  { day: "Чт", revenue: 22400 },
  { day: "Пт", revenue: 28900 },
  { day: "Сб", revenue: 31200 },
  { day: "Вс", revenue: 25600 },
];

const recentPayments = [
  { id: 1, name: "Анна М.", amount: 4500, time: "10 мин назад" },
  { id: 2, name: "Мария К.", amount: 12000, time: "25 мин назад" },
  { id: 3, name: "Елена С.", amount: 8500, time: "1 час назад" },
  { id: 4, name: "Ольга П.", amount: 4500, time: "2 часа назад" },
];

const stats = [
  { label: "Учеников за неделю", value: "12", change: "+3", icon: Users, color: "bg-blue-500" },
  { label: "Занятий", value: "4", change: "сегодня", icon: Calendar, color: "bg-green-500" },
  { label: "Выручка", value: "154.6K", change: "+12%", icon: Wallet, color: "bg-purple-500" },
];

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Привет, Ирина! 👋</h1>
          <p className="text-sm text-gray-500">Сегодня 4 занятия</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-purple-600 font-semibold">И</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <stat.icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Выручка за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₽`, "Выручка"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7C3AED"
                    strokeWidth={3}
                    dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#7C3AED" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Последние платежи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">{payment.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{payment.name}</p>
                    <p className="text-xs text-gray-500">{payment.time}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-green-600">+{payment.amount.toLocaleString()} ₽</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
