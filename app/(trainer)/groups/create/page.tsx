"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGroups } from "@/src/hooks/use-groups";
import { toast } from "sonner";

const weekDays = [
  { id: "mon", label: "Пн", dayOfWeek: 1 },
  { id: "tue", label: "Вт", dayOfWeek: 2 },
  { id: "wed", label: "Ср", dayOfWeek: 3 },
  { id: "thu", label: "Чт", dayOfWeek: 4 },
  { id: "fri", label: "Пт", dayOfWeek: 5 },
  { id: "sat", label: "Сб", dayOfWeek: 6 },
  { id: "sun", label: "Вс", dayOfWeek: 0 },
];

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const levels = [
  { value: "beginner", label: "Начинающие" },
  { value: "intermediate", label: "Средний" },
  { value: "advanced", label: "Продвинутый" },
  { value: "all", label: "Все уровни" },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const { createGroup } = useGroups();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: "beginner",
    minStudents: "5",
    selectedDays: [] as string[],
    time: "10:00",
    telegramChat: "",
  });

  const handleDayToggle = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    const schedules = formData.selectedDays.map(dayId => {
      const day = weekDays.find(d => d.id === dayId);
      return {
        dayOfWeek: day?.dayOfWeek || 1,
        time: formData.time,
      };
    });

    const result = await createGroup({
      name: formData.name,
      description: formData.description,
      minStudents: parseInt(formData.minStudents),
      telegramChat: formData.telegramChat,
      schedules,
    });

    if (result.success) {
      toast.success("Группа создана!");
      router.push("/groups");
    } else {
      toast.error(result.error || "Ошибка создания группы");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Создать группу" />

      <div className="p-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название группы *</label>
                  <Input
                    placeholder="Например: Утренняя йога"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <Textarea
                    placeholder="Описание группы, особенности занятий..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Уровень *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    {levels.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Минимум учеников *</label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={formData.minStudents}
                    onChange={(e) => setFormData({ ...formData, minStudents: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Минимальное количество для старта группы</p>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => setStep(2)}
              disabled={!formData.name}
            >
              Далее
            </Button>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Дни недели *</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleDayToggle(day.id)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          formData.selectedDays.includes(day.id)
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
                  <label className="block text-sm font-medium mb-1">Время занятий *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                {formData.selectedDays.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Расписание:</strong> {" "}
                      {formData.selectedDays.map(d => 
                        weekDays.find(wd => wd.id === d)?.label
                      ).join(", ")} в {formData.time}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Назад
              </Button>
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => setStep(3)}
                disabled={formData.selectedDays.length === 0}
              >
                Далее
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Telegram чат</p>
                    <p className="text-sm text-gray-500">Опционально</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ссылка на чат группы</label>
                  <Input
                    placeholder="https://t.me/+xxxxxxxxxxxx"
                    value={formData.telegramChat}
                    onChange={(e) => setFormData({ ...formData, telegramChat: e.target.value })}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Как привязать чат:</p>
                  <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    <li>Создайте группу в Telegram</li>
                    <li>Добавьте бота @yoga_studio_bot</li>
                    <li>Сделайте бота администратором</li>
                    <li>Вставьте ссылку выше</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="font-medium mb-3">Итоговая информация:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Название:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Уровень:</span>
                    <span className="font-medium">
                      {levels.find(l => l.value === formData.level)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Расписание:</span>
                    <span className="font-medium text-right">
                      {formData.selectedDays.map(d => 
                        weekDays.find(wd => wd.id === d)?.label
                      ).join(", ")} в {formData.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Мин. учеников:</span>
                    <span className="font-medium">{formData.minStudents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={isCreating}
              >
                Назад
              </Button>
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  "Создать группу"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
