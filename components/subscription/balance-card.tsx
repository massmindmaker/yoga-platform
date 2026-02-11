"use client";

import { motion } from "framer-motion";
import { Ticket, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface BalanceCardProps {
  balance: number;
  expiryDate?: string;
  totalClasses?: number;
  usedClasses?: number;
  userName?: string;
}

// Анимированный счётчик
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{displayValue}</span>;
}

export function BalanceCard({ 
  balance, 
  expiryDate, 
  totalClasses = 0, 
  usedClasses = 0,
  userName = "Анна"
}: BalanceCardProps) {
  const progress = totalClasses > 0 ? (usedClasses / totalClasses) * 100 : 0;
  const isLowBalance = balance <= 2;
  const isEmpty = balance === 0;

  // Определяем градиент в зависимости от баланса
  const getGradient = () => {
    if (isEmpty) return "from-gray-500 via-gray-600 to-gray-700";
    if (isLowBalance) return "from-orange-500 via-orange-600 to-red-500";
    return "from-gray-800 via-gray-900 to-black";
  };

  // Определяем цвета для прогресс-бара
  const getProgressColor = () => {
    if (isEmpty) return "bg-gray-400";
    if (isLowBalance) return "bg-gradient-to-r from-orange-400 to-red-400";
    return "bg-gradient-to-r from-white/80 via-white to-white/80";
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getGradient()} p-6 text-white shadow-xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)" }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Пульсация при низком балансе */}
      {isLowBalance && !isEmpty && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-orange-400"
          animate={{ 
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <div className="relative z-10">
        {/* Баланс */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.div 
              className="flex items-center gap-2 text-white/80 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Ticket className="w-4 h-4" />
              <span className="text-sm">Твой баланс</span>
            </motion.div>
            
            <motion.div
              className="text-5xl font-bold"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <AnimatedNumber value={balance} />
              <span className="text-2xl ml-2 font-normal text-white/80">
                {balance === 1 ? "занятие" : balance < 5 ? "занятия" : "занятий"}
              </span>
            </motion.div>
          </div>

          {/* Иконка статуса */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isLowBalance 
                ? "bg-orange-400/30" 
                : "bg-white/20"
            }`}
          >
            {isLowBalance ? (
              <AlertCircle className="w-7 h-7 text-orange-200" />
            ) : (
              <TrendingUp className="w-7 h-7 text-white" />
            )}
          </motion.div>
        </div>

        {/* Предупреждение при низком балансе */}
        {isLowBalance && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-400/30 backdrop-blur-sm rounded-xl p-3 mb-4 flex items-center gap-2"
          >
            <span className="text-sm font-medium">
              ⚠️ Осталось мало занятий. Пополни баланс!
            </span>
          </motion.div>
        )}

        {/* Дата окончания */}
        {expiryDate && (
          <motion.div 
            className="flex items-center gap-2 text-sm text-white/70 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Calendar className="w-4 h-4" />
            <span>Действует до {expiryDate}</span>
          </motion.div>
        )}

        {/* Прогресс-бар */}
        {totalClasses > 0 && (
          <motion.div 
            className="mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-between text-xs mb-2 text-white/80">
              <span>Использовано {usedClasses} из {totalClasses}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Быстрые действия */}
        <motion.div
          className="flex gap-3 mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/purchase" className="flex-1">
            <motion.button
              className="w-full bg-white text-gray-900 py-3 px-4 rounded-xl font-semibold text-sm shadow-xl"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Пополнить
            </motion.button>
          </Link>
          <Link href="/payments" className="flex-1">
            <motion.button
              className="w-full bg-white/20 text-white py-3 px-4 rounded-xl font-semibold text-sm backdrop-blur-sm border border-white/30"
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.97 }}
            >
              История
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
