"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { Calendar } from "@/components/schedule/calendar";
import { useSchedule, type ScheduleClass } from "@/src/hooks/use-schedule";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarX, Users, Clock } from "lucide-react";

export default function SchedulePage() {
  const { classes, selectedDate, setSelectedDate, isLoading } = useSchedule();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Расписание" />

      <div className="sticky top-0 z-10 bg-gray-50 pb-2">
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
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
          ))
        ) : classes.length > 0 ? (
          classes.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ScheduleClassCard classData={cls} />
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={CalendarX}
            title="Нет занятий на этот день"
            description="Расписание формируется тренером через систему голосований"
          />
        )}
      </div>
    </div>
  );
}

function ScheduleClassCard({ classData }: { classData: ScheduleClass }) {
  const booked = classData._count?.bookings || 0;
  const spotsLeft = classData.maxStudents - booked;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-sm font-bold text-gray-900">{classData.schedule.time}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">
              {classData.schedule.group.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {classData.trainer.firstName} {classData.trainer.lastName || ""}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{booked}/{classData.maxStudents}</span>
              </div>
              {spotsLeft <= 3 && spotsLeft > 0 && (
                <Badge className="bg-orange-100 text-orange-700 text-xs">
                  Осталось {spotsLeft}
                </Badge>
              )}
              {spotsLeft === 0 && (
                <Badge className="bg-gray-100 text-gray-500 text-xs">
                  Мест нет
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
