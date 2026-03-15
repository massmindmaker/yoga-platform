"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Показываем 14 дней начиная с сегодня
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // При первом рендере прокручиваем к выбранной дате
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto scrollbar-hide px-1 pb-1"
    >
      {days.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const todayFlag = isToday(date);
        const dayIndex = (date.getDay() + 6) % 7; // Пн=0..Вс=6
        const dayName = weekDays[dayIndex];
        const dayNumber = format(date, "d");

        return (
          <motion.button
            key={date.toISOString()}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onSelectDate(date)}
            className={`flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
              isSelected
                ? "bg-gray-900 text-white"
                : todayFlag
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <span className="text-[10px] opacity-70">{dayName}</span>
            <span className="font-bold text-sm">{dayNumber}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
