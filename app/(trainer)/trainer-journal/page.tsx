"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, BookOpen, Users, Calendar, CheckCircle2, XCircle } from "lucide-react";

interface ClassRecord {
  id: string;
  date: string;
  maxStudents: number;
  price: number;
  status: string;
  schedule: {
    time: string;
    group: {
      id: string;
      name: string;
    };
  };
  _count: {
    bookings: number;
  };
  bookings: Array<{
    id: string;
    userId: string;
    status: string;
    user: {
      id: string;
      firstName: string;
      lastName: string | null;
    };
  }>;
}

export default function TrainerJournalPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        setIsLoading(true);
        // Fetch last 30 days of classes
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        const response = await fetch(
          `/api/classes?from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`
        );
        const data = await response.json();

        if (data.success) {
          setClasses(data.data || []);
        } else {
          setError(data.error || "Ошибка загрузки");
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Ошибка сети");
      } finally {
        setIsLoading(false);
      }
    }

    fetchClasses();
  }, []);

  const pastClasses = classes
    .filter((c) => new Date(c.date) <= new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingClasses = classes
    .filter((c) => new Date(c.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalAttended = pastClasses.reduce(
    (sum, c) => sum + c.bookings.filter((b) => b.status === "ATTENDED").length,
    0
  );
  const totalBooked = pastClasses.reduce((sum, c) => sum + c._count.bookings, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Журнал" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Журнал" />

      <div className="p-4">
        {/* Статистика */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Calendar className="w-5 h-5 text-gray-900 mx-auto mb-1" />
            <p className="text-3xl font-bold text-gray-900">{pastClasses.length}</p>
            <p className="text-sm text-gray-500 leading-relaxed">Проведено</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-3xl font-bold text-gray-900">{totalBooked}</p>
            <p className="text-sm text-gray-500 leading-relaxed">Записей</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-3xl font-bold text-gray-900">{totalAttended}</p>
            <p className="text-sm text-gray-500 leading-relaxed">Посещений</p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="past" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="past">
              Проведённые {pastClasses.length > 0 && `(${pastClasses.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Предстоящие {upcomingClasses.length > 0 && `(${upcomingClasses.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="past" className="mt-4 space-y-3">
            {pastClasses.length > 0 ? (
              pastClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClassJournalCard classRecord={cls} />
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Нет данных"
                description="Статистика появится после проведённых занятий"
              />
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClassJournalCard classRecord={cls} isUpcoming />
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="Нет занятий"
                description="Предстоящих занятий пока нет"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ClassJournalCard({
  classRecord,
  isUpcoming = false,
}: {
  classRecord: ClassRecord;
  isUpcoming?: boolean;
}) {
  const date = new Date(classRecord.date);
  const attended = classRecord.bookings.filter((b) => b.status === "ATTENDED").length;
  const total = classRecord._count.bookings;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-snug">
              {classRecord.schedule.group.name}
            </h3>
            <p className="text-base text-gray-500 leading-relaxed">
              {format(date, "d MMMM, EEEE", { locale: ru })} в{" "}
              {classRecord.schedule.time}
            </p>
          </div>
          <Badge
            className={
              isUpcoming
                ? "bg-blue-100 text-blue-700"
                : classRecord.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }
          >
            {isUpcoming
              ? "Предстоит"
              : classRecord.status === "COMPLETED"
              ? "Проведено"
              : classRecord.status === "CANCELLED"
              ? "Отменено"
              : classRecord.status}
          </Badge>
        </div>

        {/* Список учеников */}
        {classRecord.bookings.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-bold leading-relaxed">
              Записаны: {total} / {classRecord.maxStudents}
              {!isUpcoming && ` • Пришли: ${attended}`}
            </p>
            <div className="flex flex-wrap gap-1">
              {classRecord.bookings.map((booking) => (
                <span
                  key={booking.id}
                  className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === "ATTENDED"
                      ? "bg-green-100 text-green-700"
                      : booking.status === "CANCELLED"
                      ? "bg-red-100 text-red-600 line-through"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {booking.user.firstName}
                  {booking.status === "ATTENDED" && " ✓"}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Нет записей</p>
        )}
      </CardContent>
    </Card>
  );
}
