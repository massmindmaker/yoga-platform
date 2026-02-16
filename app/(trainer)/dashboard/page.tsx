"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, TrendingUp, BookOpen, ChevronDown, ChevronUp, CreditCard, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorFallbackInline } from "@/components/ui/error-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

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
      color: "bg-gray-800" 
    },
    { 
      label: "Групп", 
      value: isLoading ? "..." : stats.totalGroups.toString(), 
      icon: Calendar, 
      color: "bg-gray-700" 
    },
    { 
      label: "Занятий сегодня", 
      value: isLoading ? "..." : stats.todayClasses.toString(), 
      icon: Clock, 
      color: "bg-gray-800" 
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Панель тренера 👋</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-0 shadow-sm cursor-pointer">
              <CardContent className="p-3">
                <div className={`${stat.color} p-2 rounded-lg w-fit`}>
                  <stat.icon size={16} className="text-white" />
                </div>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{stat.label}</p>
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
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Занятия сегодня</h2>
          <Link href="/groups">
            <Button variant="ghost" size="sm" className="text-gray-900">
              Все группы →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-1/2 rounded-xl" />
                        <Skeleton className="h-4 w-1/3 rounded-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <p className="text-center text-gray-500 text-sm mt-4">Загрузка занятий...</p>
          </div>
        ) : error ? (
          <ErrorFallbackInline 
            error={error} 
            onRetry={() => window.location.reload()} 
          />
        ) : todayClasses.length > 0 ? (
          <div className="space-y-3">
            {todayClasses.map((cls, index) => {
              const isExpanded = expandedClassId === cls.id;
              const paidBookings = cls.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];
              
              return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                >
                  <Card 
                    className="border-0 shadow-sm cursor-pointer"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white">
                          <span className="text-lg font-bold">{formatTime(cls.schedule.time)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-base leading-snug">
                            {cls.schedule.group.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-base text-gray-500 leading-relaxed">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {cls.bookings?.length || 0} записей
                            </span>
                            <Badge variant={cls.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                              {cls.status === 'SCHEDULED' ? 'Запланировано' : cls.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Разворачивающийся список записавшихся */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Записавшиеся ({paidBookings.length}):
                              </h4>
                              {paidBookings.length > 0 ? (
                                <div className="space-y-2">
                                  {paidBookings.map((booking: any) => (
                                    <div 
                                      key={booking.id} 
                                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                                    >
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                          {booking.user?.firstName?.[0]}{booking.user?.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          {booking.user?.firstName} {booking.user?.lastName}
                                        </p>
                                      </div>
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Пока нет записей</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Card className="border-0 shadow-sm cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center transition-transform duration-300">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Группы</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Управление группами</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/trainer-voting">
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Card className="border-0 shadow-sm cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center transition-transform duration-300">
                    <TrendingUp className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Голосования</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Создать опрос</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
