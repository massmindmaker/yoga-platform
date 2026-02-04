"use client";

import { motion } from "framer-motion";
import { MapPin, Users, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { YogaClass } from "@/src/types";

interface ClassCardProps {
  yogaClass: YogaClass;
  onBook?: () => void;
  onCancel?: () => void;
  onJoinWaitlist?: () => void;
  showBookButton?: boolean;
  isBooked?: boolean;
}

const typeIcons: Record<string, string> = {
  hatha: "🧘",
  vinyasa: "🌊",
  yin: "🌙",
  meditation: "🧘‍♀️",
};

export function ClassCard({ 
  yogaClass, 
  onBook, 
  onCancel,
  onJoinWaitlist,
  showBookButton = true,
  isBooked = false,
}: ClassCardProps) {
  const isFull = yogaClass.enrolledStudents >= yogaClass.maxStudents;
  const spotsLeft = yogaClass.maxStudents - yogaClass.enrolledStudents;
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const fillPercentage = (yogaClass.enrolledStudents / yogaClass.maxStudents) * 100;

  // Определяем состояние карточки
  const getState = () => {
    if (isBooked) return "booked";
    if (isFull || spotsLeft === 0) return "full";
    return "available";
  };

  const state = getState();

  // Стили для разных состояний - улучшенные с градиентами
  const stateStyles = {
    available: {
      card: "bg-white border-gray-100 hover:border-purple-200 hover:shadow-purple-100/50",
      header: "bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-transparent",
      button: "bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white shadow-lg shadow-purple-200",
      progress: "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]",
      badge: "bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]",
      timeBox: "bg-gradient-to-br from-white to-[#F5F3FF]",
      iconColor: "text-[#7C3AED]",
    },
    booked: {
      card: "bg-gradient-to-br from-[#ECFDF5] via-white to-[#F0FDFA] border-[#10B981]/30",
      header: "bg-gradient-to-r from-[#D1FAE5] via-[#A7F3D0] to-transparent",
      button: "bg-white border-2 border-[#10B981] text-[#059669] hover:bg-[#ECFDF5] shadow-md",
      progress: "bg-gradient-to-r from-[#10B981] to-[#34D399]",
      badge: "bg-gradient-to-r from-[#10B981] to-[#059669] text-white",
      timeBox: "bg-gradient-to-br from-white to-[#ECFDF5]",
      iconColor: "text-[#10B981]",
    },
    full: {
      card: "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200",
      header: "bg-gradient-to-r from-gray-100 via-gray-50 to-transparent",
      button: "bg-gray-200 text-gray-400 cursor-not-allowed",
      progress: "bg-gradient-to-r from-gray-400 to-gray-300",
      badge: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
      timeBox: "bg-gradient-to-br from-white to-gray-50",
      iconColor: "text-gray-400",
    }
  };

  const styles = stateStyles[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`border-2 shadow-sm overflow-hidden transition-all duration-300 ${styles.card}`}>
        {/* Шапка с временем и статусом */}
        <div className={`px-4 py-3 ${styles.header}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Время */}
              <motion.div 
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl shadow-sm border border-gray-100 ${styles.timeBox}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-sm font-bold text-gray-900">{yogaClass.startTime}</span>
                <div className="w-6 h-0.5 bg-gray-200 my-1" />
                <span className="text-xs text-gray-400">{yogaClass.endTime}</span>
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg truncate">{yogaClass.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {isBooked && (
                    <Badge className="bg-green-500 text-white text-xs border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Вы записаны
                    </Badge>
                  )}
                  
                  {isAlmostFull && !isBooked && !isFull && (
                    <Badge className="bg-orange-500 text-white text-xs border-0">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Осталось {spotsLeft}
                    </Badge>
                  )}
                  
                  {isFull && (
                    <Badge className="bg-gray-500 text-white text-xs border-0">
                      <XCircle className="w-3 h-3 mr-1" />
                      Мест нет
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Иконка типа занятия */}
            <div className="text-3xl ml-2">{typeIcons[yogaClass.type] || "🧘"}</div>
          </div>
        </div>

        <CardContent className="p-4 pt-3">
          {/* Место проведения */}
          {yogaClass.location && (
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <MapPin className={`w-4 h-4 ${styles.iconColor}`} />
                <span className="truncate max-w-[200px]">{yogaClass.location}</span>
              </motion.div>
            </div>
          )}

          {/* Прогресс заполнения */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className={`font-medium ${isAlmostFull ? "text-orange-600" : "text-gray-700"}`}>
                  {yogaClass.enrolledStudents}/{yogaClass.maxStudents} записано
                </span>
              </div>
              {!isFull && (
                <span className="text-gray-500 text-xs">{spotsLeft} свободно</span>
              )}
            </div>
            
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${styles.progress}`}
                initial={{ width: 0 }}
                animate={{ width: `${fillPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Цена и кнопка */}
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-2xl font-bold text-gray-900">{yogaClass.price.toLocaleString()}</span>
              <span className="text-gray-500 ml-1">₽</span>
            </motion.div>

            {showBookButton && (
              <>
                {isBooked ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      onClick={onCancel}
                      aria-label={`Отменить запись на занятие ${yogaClass.title}`}
                      className={`${styles.button} font-semibold`}
                    >
                      Отменить
                    </Button>
                  </motion.div>
                ) : isFull ? (
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      disabled
                      aria-label={`Мест нет на занятие ${yogaClass.title}`}
                      className={styles.button}
                    >
                      Мест нет
                    </Button>
                    {onJoinWaitlist && (
                      <motion.div whileHover={{ x: 2 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onJoinWaitlist}
                          aria-label={`Встать в очередь на занятие ${yogaClass.title}`}
                          className="text-[#F97316] hover:text-[#EA580C] text-xs h-auto py-1 font-medium"
                        >
                          В очередь →
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.97 }}
                    className="relative"
                  >
                    <Button
                      onClick={onBook}
                      aria-label={`Записаться на занятие ${yogaClass.title}`}
                      className={`${styles.button} font-semibold px-6`}
                    >
                      Записаться
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
