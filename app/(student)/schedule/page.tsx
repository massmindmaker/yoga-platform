"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Calendar } from "@/components/schedule/calendar";
import { ClassCard } from "@/components/schedule/class-card";
import { useSchedule } from "@/src/hooks/use-schedule";
import { useState } from "react";
import { YogaClass } from "@/src/types";
import { BookingModal } from "@/components/booking/booking-modal";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
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

export default function SchedulePage() {
  const { classes, weekDays, selectedDate, setSelectedDate, isLoading } =
    useSchedule();
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBookClass = (yogaClass: YogaClass) => {
    setSelectedClass(yogaClass);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Расписание" />

      <div className="sticky top-0 z-10 bg-gray-50 pb-2">
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-3"
      >
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : classes.length > 0 ? (
          classes.map((yogaClass) => (
            <motion.div key={yogaClass.id} variants={itemVariants}>
              <ClassCard
                yogaClass={yogaClass}
                onBook={() => handleBookClass(yogaClass)}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">
              Нет занятий на этот день
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Выберите другую дату
            </p>
          </motion.div>
        )}
      </motion.div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        yogaClass={selectedClass}
        studentId="1"
      />
    </div>
  );
}
