"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, TrendingUp, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  todayClasses: number;
}

interface TodayClass {
  id: string;
  date: string;
  status: string;
  schedule: {
    id: string;
    dayOfWeek: number;
    time: string;
    group: {
      id: string;
      name: string;
    };
  };
  trainer: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
  bookings: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalStudents: 0, 
    totalGroups: 0, 
    todayClasses: 0 
  });
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Fetch all required data in parallel
        const [usersRes, groupsRes, classesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/groups'),
          fetch(`/api/classes?from=${today}&to=${today}`)
        ]);

        const [usersData, groupsData, classesData] = await Promise.all([
          usersRes.json(),
          groupsRes.json(),
          classesRes.json()
        ]);

        // Calculate total students from users API
        let totalStudents = 0;
        if (usersData.success && usersData.data) {
          totalStudents = usersData.data.filter((u: any) => u.role === 'STUDENT').length;
        }

        // Get total groups
        let totalGroups = 0;
        if (groupsData.success && groupsData.data) {
          totalGroups = groupsData.data.length;
          // Also calculate students from groups if users API didn't work well
          if (totalStudents === 0) {
            totalStudents = groupsData.data.reduce(
              (sum: number, g: any) => sum + (g._count?.students || 0), 
              0
            );
          }
        }

        // Get today's classes
        let todayClassesCount = 0;
        let classesList: TodayClass[] = [];
        if (classesData.success && classesData.data) {
          classesList = classesData.data;
          todayClassesCount = classesData.data.length;
        }

        setStats({
          totalStudents,
          totalGroups,
          todayClasses: todayClassesCount
        });
        setTodayClasses(classesList);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[dayOfWeek];
  };

  const statCards = [
    { 
      label: "Учеников", 
      value: isLoading ? "..." : stats.totalStudents.toString(), 
      icon: Users, 
      color: "bg-blue-500" 
    },
    { 
      label: "Групп", 
      value: isLoading ? "..." : stats.totalGroups.toString(), 
      icon: Calendar, 
      color: "bg-green-500" 
    },
    { 
      label: "Занятий сегодня", 
      value: isLoading ? "..." : stats.todayClasses.toString(), 
      icon: Clock, 
      color: "bg-[#3BCEAC]" 
    },
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
            {isLoading 
              ? "Загрузка..." 
              : `${stats.totalGroups} групп · ${stats.totalStudents} учеников`
            }
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

      {/* Today's Classes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Занятия сегодня</h2>
          <Link href="/trainer-schedule">
            <Button variant="ghost" size="sm" className="text-[#3BCEAC]">
              Расписание →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6]"
              >
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        ) : todayClasses.length > 0 ? (
          <div className="space-y-3">
            {todayClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#3BCEAC] to-[#14B8A6] flex flex-col items-center justify-center text-white">
                        <span className="text-lg font-bold">{formatTime(cls.schedule.time)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {cls.schedule.group.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {cls.bookings?.length || 0} записей
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            cls.status === 'SCHEDULED' 
                              ? 'bg-blue-100 text-blue-700' 
                              : cls.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cls.status === 'SCHEDULED' ? 'Запланировано' : cls.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Сегодня нет занятий</p>
              <p className="text-sm text-gray-500 mt-1">Отдыхайте или создайте новое занятие</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link href="/groups">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Группы</p>
                  <p className="text-xs text-gray-500">Управление группами</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/trainer-voting">

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#CCFBF1] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#3BCEAC]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Голосования</p>
                  <p className="text-xs text-gray-500">Создать опрос</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {!isLoading && stats.totalGroups === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Нет групп"
          description="Создайте первую группу для начала работы"
        />
      )}
    </div>
  );
}
