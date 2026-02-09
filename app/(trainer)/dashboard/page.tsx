"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  todayClasses: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalGroups: 0, todayClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/groups');
        const json = await res.json();
        if (json.success && json.data) {
          const groups = json.data;
          const totalStudents = groups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0);
          setStats({
            totalStudents,
            totalGroups: groups.length,
            todayClasses: 0,
          });
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Учеников", value: stats.totalStudents.toString(), icon: Users, color: "bg-blue-500" },
    { label: "Групп", value: stats.totalGroups.toString(), icon: Calendar, color: "bg-green-500" },
    { label: "Занятий сегодня", value: stats.todayClasses.toString(), icon: Wallet, color: "bg-[#3BCEAC]" },
  ];

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Панель тренера 👋</h1>
          <p className="text-sm text-gray-500">
            {isLoading ? "Загрузка..." : `${stats.totalGroups} групп · ${stats.totalStudents} учеников`}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className={`${stat.color} p-2 rounded-lg w-fit`}>
                  <stat.icon size={16} className="text-white" />
                </div>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isLoading && stats.totalGroups === 0 && (
        <EmptyState
          icon={Calendar}
          title="Нет групп"
          description="Создайте первую группу для начала работы"
        />
      )}
    </div>
  );
}
