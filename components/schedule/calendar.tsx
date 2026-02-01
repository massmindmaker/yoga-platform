"use client";

import { motion } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDaysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex gap-1">
      {weekDaysList.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const dayName = weekDays[index];
        const dayNumber = format(date, "d");

        return (
          <motion.button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
              isSelected
                ? "bg-[#7C3AED] text-white"
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
