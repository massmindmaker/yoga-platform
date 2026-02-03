"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Yoga Studio" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
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
            <h2 className="text-lg font-semibold text-gray-900">
              Ближайшие занятия
            </h2>
            <Link
              href="/history"
              className="text-sm text-purple-600 flex items-center hover:text-purple-700"
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
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {booking.yogaClass.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.yogaClass.startTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {booking.yogaClass.location}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
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
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">У вас нет предстоящих занятий</p>
                <Link href="/schedule">
                  <Button className="bg-purple-600 hover:bg-purple-700">
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
              <h2 className="text-lg font-semibold text-gray-900">
                Ближайший интенсив
              </h2>
              <Link
                href="/intensives"
                className="text-sm text-purple-600 flex items-center hover:text-purple-700"
              >
                Все
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Link href={`/intensives/${featuredIntensive.id}`}>
              <Card className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">{featuredIntensive.title}</h3>
                    <p className="text-sm text-white/80">
                      {featuredIntensive.durationDays} дней ·{" "}
                      {featuredIntensive.price.toLocaleString()} ₽
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {featuredIntensive.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-500">
                      {featuredIntensive.enrolledParticipants}/
                      {featuredIntensive.maxParticipants} участников
                    </span>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
