"use client";

import { motion } from "framer-motion";
import { Clock, Users, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VotingOption {
  id: string;
  day: string;
  time: string;
  votes: number;
}

interface VotingCardProps {
  id: string;
  title: string;
  deadline: string;
  minParticipants: number;
  currentVotes: number;
  options: VotingOption[];
  hasVoted?: boolean;
  onVote?: (optionId: string) => void;
}

export function VotingCard({
  title,
  deadline,
  minParticipants,
  currentVotes,
  options,
  hasVoted = false,
  onVote,
}: VotingCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isSuccessful = currentVotes >= minParticipants;
  const progressPercent = Math.min((currentVotes / minParticipants) * 100, 100);

  // Расчет оставшегося времени
  const getTimeLeft = () => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Голосование закрыто";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} дн ${hours} ч`;
    return `${hours} ч`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  До {new Date(deadline).toLocaleDateString("ru-RU")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Минимум {minParticipants} чел
                </span>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              {getTimeLeft()}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Проголосовало</span>
              <span className={`font-bold ${isSuccessful ? "text-green-600" : "text-orange-600"}`}>
                {currentVotes}/{minParticipants}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isSuccessful 
                    ? "bg-gradient-to-r from-green-400 to-green-500" 
                    : "bg-gradient-to-r from-orange-400 to-orange-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isSuccessful 
                ? "✅ Занятие состоится!" 
                : `Нужно еще ${minParticipants - currentVotes} человек`
              }
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Выберите время:</p>
            {options.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
                disabled={hasVoted}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  selectedOption === option.id
                    ? "border-purple-500 bg-purple-50"
                    : hasVoted
                    ? "border-gray-100 bg-gray-50 opacity-60"
                    : "border-gray-100 hover:border-purple-200 bg-white"
                }`}
                whileTap={!hasVoted ? { scale: 0.98 } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === option.id
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {selectedOption === option.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {option.day}, {option.time}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {option.votes} голосов
                  </Badge>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Action Button */}
          {!hasVoted ? (
            <Button
              onClick={() => selectedOption && onVote?.(selectedOption)}
              disabled={!selectedOption}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white h-12 rounded-xl font-semibold shadow-lg disabled:opacity-50"
            >
              Проголосовать
            </Button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Вы проголосовали</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {isSuccessful 
                  ? "Занятие состоится. Ссылка на оплату придет после закрытия голосования."
                  : "Ожидаем набора минимального количества участников."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Компонент для создания голосования (для тренера)
export function CreateVotingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: "conditional" as "conditional" | "online",
    days: [] as string[],
    time: "07:30",
    minParticipants: 10,
    deadline: "",
    price: 700,
  });

  const weekDays = [
    { id: "mon", label: "Пн" },
    { id: "tue", label: "Вт" },
    { id: "wed", label: "Ср" },
    { id: "thu", label: "Чт" },
    { id: "fri", label: "Пт" },
  ];

  const toggleDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Type */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Тип голосования</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setFormData({ ...formData, type: "conditional" })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.type === "conditional"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-100 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Условное занятие</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Занятие состоится только если наберется минимум участников
                      </p>
                    </div>
                    {formData.type === "conditional" && (
                      <CheckCircle2 className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, type: "online" })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.type === "online"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-100 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Онлайн-расписание</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Голосование за каждый день недели отдельно с плавающей ценой
                      </p>
                    </div>
                    {formData.type === "online" && (
                      <CheckCircle2 className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => setStep(2)}
            className="w-full bg-purple-600 hover:bg-purple-700 h-12"
          >
            Далее
          </Button>
        </motion.div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дни недели</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`w-12 h-12 rounded-xl font-medium transition-colors ${
                        formData.days.includes(day.id)
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Время</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Минимальное количество участников
                </label>
                <input
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => setFormData({ ...formData, minParticipants: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дедлайн голосования</label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12"
            >
              Назад
            </Button>
            <Button 
              onClick={() => setStep(3)}
              disabled={formData.days.length === 0 || !formData.deadline}
              className="flex-1 bg-purple-600 hover:bg-purple-700 h-12"
            >
              Далее
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Price & Confirm */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Базовая цена (₽)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3"
                  min={1}
                />
              </div>

              {formData.type === "online" && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Для онлайн-занятий цена будет рассчитываться автоматически:
                    <br />• 10+ человек: 600₽
                    <br />• 5-9 человек: 800₽
                    <br />• 3-4 человека: 1000₽
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-sm">Итоговая информация:</p>
                <div className="text-sm space-y-1">
                  <p>Тип: {formData.type === "conditional" ? "Условное" : "Онлайн"}</p>
                  <p>Дни: {formData.days.map(d => weekDays.find(wd => wd.id === d)?.label).join(", ")}</p>
                  <p>Время: {formData.time}</p>
                  <p>Минимум участников: {formData.minParticipants}</p>
                  <p>Базовая цена: {formData.price}₽</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 h-12"
            >
              Назад
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 h-12"
              onClick={() => console.log("Create voting:", formData)}
            >
              Создать голосование
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
