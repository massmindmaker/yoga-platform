"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChevronRight, Plus, Loader2, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/src/hooks/use-groups";

const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function formatSchedule(schedules: { dayOfWeek: number; time: string }[]) {
  if (!schedules || schedules.length === 0) return null;
  
  // Group by time
  const byTime = schedules.reduce((acc, s) => {
    if (!acc[s.time]) acc[s.time] = [];
    acc[s.time].push(s.dayOfWeek);
    return acc;
  }, {} as Record<string, number[]>);

  return Object.entries(byTime)
    .map(([time, days]) => {
      const dayNames = days.sort((a, b) => a - b).map(d => DAYS_SHORT[d]).join(", ");
      return { days: dayNames, time };
    });
}

export default function GroupsPage() {
  const { groups, isLoading, error } = useGroups();

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-gray-800 hover:bg-black"
        >
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Мои группы</h1>
              <p className="text-sm text-gray-500 mt-0.5">{groups.length} {groups.length === 1 ? "группа" : "групп"}</p>
            </div>
            <Link href="/groups/create">
              <Button size="default" className="bg-gradient-to-r from-gray-800 to-gray-700 hover:bg-black">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {groups.map((group: any, index) => {
          const schedule = formatSchedule(group.schedules || []);
          const isIntensive = group.groupType === "INTENSIVE";
          
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/groups/${group.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
                  <CardContent className="p-0">
                    {/* Top colored bar */}
                    <div className={`h-1 ${isIntensive ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-gray-800 to-gray-700"}`} />
                    
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{group.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant="secondary" 
                              className={isIntensive ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-black"}
                            >
                              {isIntensive ? "Интенсив" : "Регулярные"}
                            </Badge>
                            {group.pricingType && (
                              <Badge variant="outline" className="text-xs">
                                {group.pricingType === "FIXED" ? `${group.fixedPrice || 1000}₽` : "Динамика"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>

                      {/* Schedule */}
                      {!isIntensive && schedule && schedule.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {schedule.map((s, i) => (
                              <span key={i}>
                                {s.days} — {s.time}
                                {i < schedule.length - 1 && "; "}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}

                      {/* Intensive dates */}
                      {isIntensive && group.startsAt && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {new Date(group.startsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                            {group.endsAt && ` — ${new Date(group.endsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>мин. {group.maxStudents}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                          group._count.students > 0 
                            ? "bg-gray-50 text-gray-900" 
                            : "bg-gray-50 text-gray-500"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            group._count.students > 0 ? "bg-gray-900" : "bg-gray-400"
                          }`} />
                          <span className="text-xs font-medium">
                            {group._count.students || 0} учеников
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4"
        >
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">У вас пока нет групп</h3>
            <p className="text-sm text-gray-500 mb-6">Создайте первую группу для занятий</p>
            <Link href="/groups/create">
              <Button className="bg-gradient-to-r from-gray-800 to-gray-700 hover:bg-black">
                <Plus className="w-4 h-4 mr-2" />
                Создать первую группу
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

    </div>
  );
}
