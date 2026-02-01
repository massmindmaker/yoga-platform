"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  used: number;
  total: number;
  showLabel?: boolean;
}

export function ProgressBar({ used, total, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  
  // Определяем цвет в зависимости от процента
  const getColor = () => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const remaining = total - used;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Использовано {used} из {total}
          </span>
          <span className={`font-medium ${
            percentage >= 80 ? "text-red-600" : 
            percentage >= 50 ? "text-yellow-600" : "text-green-600"
          }`}>
            {remaining} осталось
          </span>
        </div>
      )}
      
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
