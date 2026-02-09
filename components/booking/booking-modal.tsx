"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { YogaClass } from "@/src/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useBooking } from "@/src/hooks/use-booking";
import { useState } from "react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  yogaClass: YogaClass | null;
  studentId: string;
}

export function BookingModal({
  isOpen,
  onClose,
  yogaClass,
  studentId,
}: BookingModalProps) {
  const { bookClass } = useBooking(studentId);
  const [isLoading, setIsLoading] = useState(false);

  if (!yogaClass) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await bookClass(yogaClass.id, studentId);
      onClose();
    } catch (error) {
      console.error("Booking failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#3BCEAC]" />
                  Запись на занятие
                </DialogTitle>
                <DialogDescription>
                  Подтвердите запись на выбранное занятие
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Class Info */}
                <div className="bg-gradient-to-br from-[#F0FDF9] to-[#CCFBF1] rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {yogaClass.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[#3BCEAC]" />
                    <span>
                      {format(new Date(yogaClass.date), "EEEE, d MMMM", {
                        locale: ru,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#3BCEAC]" />
                    <span>
                      {yogaClass.startTime} - {yogaClass.endTime} (
                      {yogaClass.duration} мин)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-[#3BCEAC]" />
                    <span>
                      {yogaClass.trainer.firstName} {yogaClass.trainer.lastName}
                    </span>
                  </div>

                  {yogaClass.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[#3BCEAC]" />
                      <span>{yogaClass.location}</span>
                    </div>
                  )}
                </div>

                {/* Price Info */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Стоимость:</span>
                    <span className="text-lg font-bold text-[#3BCEAC]">
                    {yogaClass.price.toLocaleString()} ₽
                  </span>
                </div>

                {/* Confirmation Text */}
                <p className="text-sm text-gray-500 text-center">
                  С вашего баланса будет списано{" "}
                    <span className="font-semibold text-[#3BCEAC]">1 занятие</span>
                </p>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1 bg-[#3BCEAC] hover:bg-[#14B8A6]"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      "Подтвердить"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
