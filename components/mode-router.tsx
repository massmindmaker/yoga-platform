"use client";

import { motion } from "framer-motion";
import { useMode } from "@/src/hooks/use-mode";
import { ModeToggle } from "@/components/mode-toggle";

// Student components
import { PageHeader as StudentHeader } from "@/components/layout/page-header";
import { BottomNav as StudentNav } from "@/components/layout/bottom-nav";
import { BalanceCard } from "@/components/subscription/balance-card";
import { useBooking } from "@/src/hooks/use-booking";
import { mockStudents, mockIntensives } from "@/src/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, MapPin, ChevronRight } from "lucide-react";

// Trainer components  
import TrainerDashboard from "@/app/(trainer)/dashboard/page";
import TrainerLayout from "@/app/(trainer)/layout";

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

// Student Dashboard View
function StudentDashboard() {
  const user = mockStudents[0];
  const { bookings } = useBooking("1");

  const upcomingClasses = bookings
    .filter((b) => b.status === "CONFIRMED")
    .slice(0, 2);

  const featuredIntensive = mockIntensives[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader title="Yoga Studio" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6 pb-24"
      >
        <motion.div variants={itemVariants}>
          <BalanceCard
            balance={user?.balance || 0}
            totalClasses={user?.subscription?.totalClasses || 0}
            usedClasses={user?.subscription?.usedClasses || 0}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Ближайшие занятия</h2>
            <Link href="/schedule" className="text-sm text-purple-600 flex items-center">
              Все<ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{booking.yogaClass.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />{booking.yogaClass.startTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />{booking.yogaClass.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">У вас нет предстоящих занятий</p>
                <Link href="/schedule">
                  <Button className="bg-purple-600 hover:bg-purple-700">Записаться</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {featuredIntensive && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Ближайший интенсив</h2>
              <Link href="/intensives" className="text-sm text-purple-600 flex items-center">
                Все<ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <Link href={`/intensives/${featuredIntensive.id}`}>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold">{featuredIntensive.title}</h3>
                    <p className="text-sm text-white/80">
                      {featuredIntensive.durationDays} дней · {featuredIntensive.price.toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}
      </motion.div>

      <StudentNav />
    </div>
  );
}

// Main Mode Router
export function ModeRouter() {
  const { mode } = useMode();

  return (
    <>
      <ModeToggle />
      {mode === "student" ? (
        <StudentDashboard />
      ) : (
        <TrainerLayout>
          <TrainerDashboard />
        </TrainerLayout>
      )}
    </>
  );
}
