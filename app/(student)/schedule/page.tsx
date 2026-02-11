"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { Calendar } from "@/components/schedule/calendar";
import { useSchedule, type ScheduleClass } from "@/src/hooks/use-schedule";
import { useBooking } from "@/src/hooks/use-booking";
import { useUser } from "@/src/hooks/use-user-context";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarX, Users, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SchedulePage() {
  const { classes, selectedDate, setSelectedDate, isLoading, refetch } = useSchedule();
  const { user } = useUser();
  const { bookings, bookClass, cancelBooking, refetch: refetchBookings } = useBooking(user?.id);

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
              <div className="flex gap-4 items-center">
                <Skeleton className="w-20 h-20 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4 rounded-xl" />
                  <Skeleton className="h-5 w-1/2 rounded-xl" />
                  <Skeleton className="h-5 w-1/3 rounded-xl" />
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-3">Загрузка...</p>
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
              <ScheduleClassCard 
                classData={cls} 
                userId={user?.id}
                bookings={bookings}
                onBook={bookClass}
                onCancel={cancelBooking}
                onUpdate={refetchBookings}
              />
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

interface ScheduleClassCardProps {
  classData: ScheduleClass;
  userId?: string;
  bookings: Array<{ id: string; classId: string; status: string }>;
  onBook: (classId: string, userId: string) => Promise<void>;
  onCancel: (bookingId: string) => Promise<void>;
  onUpdate: () => void;
}

function ScheduleClassCard({ 
  classData, 
  userId, 
  bookings, 
  onBook, 
  onCancel,
  onUpdate 
}: ScheduleClassCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const booked = classData._count?.bookings || 0;
  const spotsLeft = classData.maxStudents - booked;
  
  // Проверяем, записан ли пользователь на это занятие
  const userBooking = bookings.find(b => b.classId === classData.id && b.status === 'CONFIRMED');
  const isBooked = !!userBooking;
  
  const handleBook = async () => {
    if (!userId) {
      toast.error('Необходима авторизация');
      return;
    }
    setIsLoading(true);
    try {
      await onBook(classData.id, userId);
      onUpdate();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!userBooking) return;
    setIsLoading(true);
    try {
      await onCancel(userBooking.id);
      onUpdate();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-sm font-bold text-gray-900">{classData.schedule.time}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-snug">
              {classData.schedule.group.name}
            </h3>
            <p className="text-base text-gray-500 mt-1 leading-relaxed">
              {classData.trainer.firstName} {classData.trainer.lastName || ""}
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-base text-gray-500 leading-relaxed">
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
              {isBooked && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Вы записаны
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Кнопки записи */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {isBooked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isLoading ? 'Отмена...' : 'Отменить запись'}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleBook}
              disabled={isLoading || spotsLeft === 0}
              className="w-full bg-gray-900 hover:bg-black text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isLoading 
                ? 'Запись...' 
                : spotsLeft === 0 
                  ? 'Мест нет' 
                  : 'Записаться'
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
