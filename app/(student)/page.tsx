"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/subscription/balance-card";
import { useBooking } from "@/src/hooks/use-booking";
import { mockYogaClasses, mockIntensives, mockStudents } from "@/src/lib/mock-data";
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
  const user = mockStudents[0];
  const { bookings } = useBooking("1");

  const upcomingClasses = bookings
    .filter((b) => b.status === "CONFIRMED")
    .slice(0, 2);

  const featuredIntensive = mockIntensives[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
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
          className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl shadow-purple-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-purple-100 text-sm font-medium">Добро пожаловать</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{user?.firstName || 'Имя'} 👋</h1>
          <p className="text-purple-100">Готовы к практике сегодня?</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={itemVariants}>
          <BalanceCard
            balance={user?.balance || 0}
            totalClasses={user?.subscription?.totalClasses || 0}
            usedClasses={user?.subscription?.usedClasses || 0}
          />
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Ближайшие занятия
            </h2>
            <Link
              href="/history"
              className="text-sm text-purple-600 flex items-center hover:text-purple-700 font-medium"
            >
              Все
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {booking.yogaClass.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                              <Clock className="w-4 h-4 text-purple-500" />
                              {booking.yogaClass.startTime}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {booking.yogaClass.location}
                            </span>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {booking.yogaClass.trainer.firstName[0]}
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
          )}
        </motion.div>

        {/* Featured Intensive */}
        {featuredIntensive && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Ближайший интенсив
              </h2>
              <Link
                href="/intensives"
                className="text-sm text-purple-600 flex items-center hover:text-purple-700 font-medium"
              >
                Все
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Link href={`/intensives/${featuredIntensive.id}`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="border-0 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all">
                  <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <motion.h3 
                        className="font-bold text-xl mb-1"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {featuredIntensive.title}
                      </motion.h3>
                      <p className="text-sm text-white/90">
                        {featuredIntensive.durationDays} дней ·{" "}
                        {featuredIntensive.price.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-white">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {featuredIntensive.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1,2,3].map((i) => (
                            <div 
                              key={i}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 border-2 border-white"
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {featuredIntensive.enrolledParticipants}/{featuredIntensive.maxParticipants} участников
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-200"
                      >
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
