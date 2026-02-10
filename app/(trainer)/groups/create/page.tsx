"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CreditCard, Loader2, MessageCircle } from "lucide-react";
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
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

export default function CreateGroupPage() {
  const router = useRouter();
  const { createGroup } = useGroups();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "REGULAR" as "REGULAR" | "INTENSIVE",
    pricingType: "FIXED" as "FIXED" | "DYNAMIC",
    fixedPrice: 1,
    intensivePrice: 3000,
    minStudents: 3,
    selectedDays: [] as string[],
    time: "10:00",
    telegramChat: "",
    startsAt: "",
    endsAt: "",
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
    
    const schedules = formData.groupType === "REGULAR" 
      ? formData.selectedDays.map(dayId => {
          const day = weekDays.find(d => d.id === dayId);
          return {
            dayOfWeek: day?.dayOfWeek || 1,
            time: formData.time,
          };
        })
      : [];

    const result = await createGroup({
      name: formData.name,
      description: formData.description,
      groupType: formData.groupType,
      pricingType: formData.groupType === "REGULAR" ? formData.pricingType : undefined,
      fixedPrice: formData.groupType === "REGULAR" && formData.pricingType === "FIXED" 
        ? formData.fixedPrice 
        : undefined,
      intensivePrice: formData.groupType === "INTENSIVE" 
        ? formData.intensivePrice 
        : undefined,
      maxStudents: formData.minStudents,
      telegramChat: formData.telegramChat,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
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
                s <= step ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Основное */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-base font-bold mb-2">Название группы *</label>
                  <Input
                    placeholder="Например: Утренняя йога"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-base font-bold mb-2">Описание</label>
                  <Textarea
                    placeholder="Описание группы, особенности занятий..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-base font-bold mb-2">Тип группы *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, groupType: "REGULAR" })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.groupType === "REGULAR"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-900" />
                      <span className="text-sm font-medium block">Регулярные</span>
                      <p className="text-xs text-gray-500 mt-1">Еженедельное расписание</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, groupType: "INTENSIVE" })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.groupType === "INTENSIVE"
                          ? "border-orange-600 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                      <span className="text-sm font-medium block">Интенсив</span>
                      <p className="text-xs text-gray-500 mt-1">Разовое событие</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold mb-2">Минимум учеников *</label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={formData.minStudents}
                    onChange={(e) => setFormData({ ...formData, minStudents: parseInt(e.target.value) || 3 })}
                  />
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">Минимальное количество для старта группы</p>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-gray-800 hover:bg-black"
              onClick={() => setStep(2)}
              disabled={!formData.name}
            >
              Далее
            </Button>
          </motion.div>
        )}

        {/* Step 2: Ценообразование и расписание */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Ценообразование для регулярных */}
            {formData.groupType === "REGULAR" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-gray-900" />
                    <span className="font-bold text-lg">Ценообразование</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricingType: "FIXED" })}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.pricingType === "FIXED"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium block">Фиксированная</span>
                      <p className="text-xs text-gray-500 mt-1">Списание с баланса</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricingType: "DYNAMIC" })}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.pricingType === "DYNAMIC"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium block">Динамическая</span>
                      <p className="text-xs text-gray-500 mt-1">Цена после голосования</p>
                    </button>
                  </div>

                  {formData.pricingType === "FIXED" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Списывать занятий с баланса</label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.fixedPrice}
                        onChange={(e) => setFormData({ ...formData, fixedPrice: parseInt(e.target.value) || 1 })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Сколько занятий списывать при записи
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Цена для интенсива */}
            {formData.groupType === "INTENSIVE" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span className="font-bold text-lg">Стоимость интенсива</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Цена (₽) *</label>
                    <Input
                      type="number"
                      min={100}
                      step={100}
                      placeholder="3000"
                      value={formData.intensivePrice}
                      onChange={(e) => setFormData({ ...formData, intensivePrice: parseInt(e.target.value) || 3000 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Единая цена за весь интенсив
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Расписание для REGULAR */}
            {formData.groupType === "REGULAR" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-gray-900" />
                    <span className="font-bold text-lg">Расписание</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Дни недели *</label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleDayToggle(day.id)}
                          className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                            formData.selectedDays.includes(day.id)
                              ? "bg-gray-900 text-white"
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
                      className="w-full h-10 rounded-md border border-input bg-transparent px-3"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {formData.selectedDays.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Расписание:</strong> { " " }
                        {formData.selectedDays.map(d => 
                          weekDays.find(wd => wd.id === d)?.label
                        ).join(", ")} в {formData.time}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Даты для INTENSIVE */}
            {formData.groupType === "INTENSIVE" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="font-bold text-lg">Даты интенсива</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Начало *</label>
                      <Input
                        type="date"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Окончание *</label>
                      <Input
                        type="date"
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Назад
              </Button>
              <Button 
                className="flex-1 bg-gray-800 hover:bg-black"
                onClick={() => setStep(3)}
                disabled={
                  formData.groupType === "REGULAR" 
                    ? formData.selectedDays.length === 0
                    : !formData.startsAt || !formData.endsAt
                }
              >
                Далее
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Telegram */}
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
                    <p className="font-bold text-base">Telegram чат</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Опционально</p>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold mb-2">Ссылка на чат группы</label>
                  <Input
                    placeholder="https://t.me/+xxxxxxxxxxxx"
                    value={formData.telegramChat}
                    onChange={(e) => setFormData({ ...formData, telegramChat: e.target.value })}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-base font-bold">Как привязать чат:</p>
                  <ol className="text-base text-gray-600 list-decimal list-inside space-y-1 leading-relaxed">
                    <li>Создайте группу в Telegram</li>
                    <li>Добавьте бота @Yom23_bot</li>
                    <li>Сделайте бота администратором</li>
                    <li>Вставьте ссылку выше</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="font-bold text-lg mb-3 leading-tight">Итоговая информация:</p>
                <div className="space-y-2 text-base leading-relaxed">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Название:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Тип:</span>
                    <span className="font-medium">
                      {formData.groupType === "REGULAR" ? "Регулярные занятия" : "Интенсив"}
                    </span>
                  </div>
                  {formData.groupType === "REGULAR" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ценообразование:</span>
                      <span className="font-medium">
                        {formData.pricingType === "FIXED" 
                          ? `Списание ${formData.fixedPrice} занятия` 
                          : "Динамическое"}
                      </span>
                    </div>
                  )}
                  {formData.groupType === "INTENSIVE" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Стоимость:</span>
                      <span className="font-medium">{formData.intensivePrice.toLocaleString()} ₽</span>
                    </div>
                  )}
                  {formData.groupType === "REGULAR" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Расписание:</span>
                      <span className="font-medium text-right">
                        {formData.selectedDays.map(d => 
                          weekDays.find(wd => wd.id === d)?.label
                        ).join(", ")} в {formData.time}
                      </span>
                    </div>
                  )}
                  {formData.groupType === "INTENSIVE" && formData.startsAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Даты:</span>
                      <span className="font-medium">
                        {new Date(formData.startsAt).toLocaleDateString("ru-RU")} — {new Date(formData.endsAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  )}
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
                className="flex-1 bg-gray-800 hover:bg-black"
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
