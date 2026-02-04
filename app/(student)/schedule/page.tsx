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
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX } from "lucide-react";

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
          <EmptyState
            icon={CalendarX}
            title="Нет занятий на этот день"
            description="Выберите другую дату или проверьте расписание позже"
          />
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
