"use client";

import { motion } from "framer-motion";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Intensive } from "@/src/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface IntensiveCardProps {
  intensive: Intensive;
  onRegister?: () => void;
}

export function IntensiveCard({ intensive, onRegister }: IntensiveCardProps) {
  const isFull = intensive.enrolledParticipants >= intensive.maxParticipants;
  const spotsLeft = intensive.maxParticipants - intensive.enrolledParticipants;

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-purple-700">
            {intensive.durationDays} дней
          </Badge>
        </div>

        <div className="absolute bottom-3 left-4 text-white">
          <h3 className="font-bold text-lg">{intensive.title}</h3>
          <p className="text-sm text-white/80">
            с {format(new Date(intensive.startDate), "d MMMM", { locale: ru })} по{" "}
            {format(new Date(intensive.endDate), "d MMMM", { locale: ru })}
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {intensive.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{intensive.schedule.join(", ")}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {intensive.price.toLocaleString()} ₽
            </span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span className={spotsLeft <= 3 ? "text-amber-600 font-medium" : ""}>
                {intensive.enrolledParticipants}/{intensive.maxParticipants} участников
                {spotsLeft <= 3 && spotsLeft > 0 && ` · Осталось ${spotsLeft}`}
              </span>
            </div>
          </div>

          <Button
            onClick={onRegister}
            disabled={isFull}
            className={isFull ? "" : "bg-purple-600 hover:bg-purple-700"}
          >
            {isFull ? "Мест нет" : "Записаться"}
            {!isFull && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
