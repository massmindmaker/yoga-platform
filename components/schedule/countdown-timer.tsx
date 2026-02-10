"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date;
  title?: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeUnit({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) {
  const displayValue = value.toString().padStart(2, "0");
  
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
    >
      <motion.div
        key={displayValue}
        className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg shadow-black/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span className="text-xl font-bold">{displayValue}</span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </motion.div>
      <span className="text-xs text-gray-500 mt-1 font-medium">{label}</span>
    </motion.div>
  );
}

export function CountdownTimer({ targetDate, title = "До занятия осталось", className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2;
  const isStarted = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <motion.div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: isUrgent ? Infinity : 0 }}
        >
          {isStarted ? (
            <Clock className="w-5 h-5 text-green-500" />
          ) : (
            <Timer className={`w-5 h-5 ${isUrgent ? "text-orange-500" : "text-gray-700"}`} />
          )}
        </motion.div>
        <span className={`text-sm font-medium ${isUrgent ? "text-orange-600" : "text-gray-700"}`}>
          {isStarted ? "Занятие началось!" : title}
        </span>
      </div>

      {isStarted ? (
        <motion.div
          className="flex items-center justify-center py-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-200">
            Присоединяйтесь сейчас!
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {timeLeft.days > 0 && (
            <>
              <TimeUnit value={timeLeft.days} label="дн" delay={0} />
              <span className="text-2xl font-bold text-gray-300">:</span>
            </>
          )}
          <TimeUnit value={timeLeft.hours} label="час" delay={0.1} />
          <span className="text-2xl font-bold text-gray-300">:</span>
          <TimeUnit value={timeLeft.minutes} label="мин" delay={0.2} />
          <span className="text-2xl font-bold text-gray-300">:</span>
          <TimeUnit value={timeLeft.seconds} label="сек" delay={0.3} />
        </div>
      )}

      {!isStarted && (
        <div className="mt-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isUrgent 
                  ? "bg-gradient-to-r from-orange-400 to-red-400" 
                   : "bg-gradient-to-r from-gray-700 to-gray-500"
              }`}
              initial={{ width: "100%" }}
              animate={{ 
                width: `${Math.max(0, Math.min(100, 
                  ((targetDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) * 100
                ))}%` 
              }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
