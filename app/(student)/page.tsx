"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/subscription/balance-card";
import { useUser } from "@/src/hooks/use-user-context";
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

interface BookingWithClass {
  id: string;
  status: string;
  class: {
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
        description: string | null;
      };
    };
  };
}

export default function MainPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithClass[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoadingBookings(false);
      return;
    }

    async function fetchUpcomingBookings() {
      try {
        setIsLoadingBookings(true);
        setError(null);
        
        const response = await fetch(`/api/bookings?userId=${user!.id}&upcoming=true`);
        const data = await response.json();
        
        if (data.success) {
          setUpcomingBookings(data.data || []);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings");
      } finally {
        setIsLoadingBookings(false);
      }
    }

    fetchUpcomingBookings();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayOfWeek];
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-2xl p-6 text-white shadow-xl shadow-black/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white/80 text-sm font-medium">Добро пожаловать</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {isUserLoading ? "Загрузка..." : user?.firstName || "Студент"} 👋
          </h1>
          <p className="text-white/80">Готовы к практике сегодня?</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={itemVariants}>
          <BalanceCard
            balance={user?.balance || 0}
            totalClasses={0}
            usedClasses={0}
            userName={user?.firstName}
          />
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Ближайшие занятия
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-gray-900 flex items-center hover:text-black font-medium"
            >
              Все
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingBookings ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                   <Calendar className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-gray-600 font-medium">Загрузка занятий...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                   className="bg-gradient-to-r from-gray-900 to-black"
                >
                   Попробовать снова
                </Button>
              </CardContent>
            </Card>
          ) : upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white">
                          <span className="text-xs font-medium opacity-80">
                            {getDayName(booking.class.schedule.dayOfWeek)}
                          </span>
                          <span className="text-lg font-bold">
                            {new Date(booking.class.date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {booking.class.schedule.group.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(booking.class.schedule.time)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              Студия
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {booking.status === 'CONFIRMED' ? 'Подтверждено' : booking.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-4">
                   <Sparkles className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-gray-600 mb-4 font-medium">У вас нет предстоящих занятий</p>
                <Link href="/schedule">
                   <Button className="bg-gray-900 hover:bg-black shadow-lg shadow-black/10">
                    Записаться
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
