"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChevronRight, Plus, Calendar, CreditCard, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorFallbackInline } from "@/components/ui/error-fallback";
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="p-4">
            <Skeleton className="h-10 w-48 rounded-xl mb-2" />
            <Skeleton className="h-5 w-24 rounded-xl" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <Skeleton className="h-1 w-full rounded-xl mb-4" />
              <Skeleton className="h-7 w-3/4 rounded-xl mb-3" />
              <Skeleton className="h-5 w-1/2 rounded-xl mb-2" />
              <Skeleton className="h-5 w-1/3 rounded-xl" />
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">Загрузка групп...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorFallbackInline error={error} onRetry={() => window.location.reload()} />
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
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">Мои группы</h1>
              <p className="text-base text-gray-500 mt-1 leading-relaxed">{groups.length} {groups.length === 1 ? "группа" : "групп"}</p>
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
        {groups.map((group, index) => {
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
                          <h3 className="font-bold text-xl text-gray-900 mb-2 truncate leading-snug">{group.name}</h3>
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
                        <div className="flex items-center gap-2 mb-2 text-base text-gray-600 leading-relaxed">
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
                        <div className="flex items-center gap-2 mb-2 text-base text-gray-600 leading-relaxed">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {new Date(group.startsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                            {group.endsAt && ` — ${new Date(group.endsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-base leading-relaxed">
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
        <EmptyState
          icon={UsersRound}
          title="У вас пока нет групп"
          description="Создайте первую группу для занятий"
          action={() => window.location.href = '/groups/create'}
          actionLabel="Создать группу"
        />
      )}

    </div>
  );
}
