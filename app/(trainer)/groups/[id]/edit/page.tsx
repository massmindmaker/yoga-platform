"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, MessageCircle, Calendar, CreditCard, Clock } from "lucide-react";
import { useGroup } from "@/src/hooks/use-groups";

const weekDays = [
  { id: 0, label: "Пн", dayOfWeek: 1 },
  { id: 1, label: "Вт", dayOfWeek: 2 },
  { id: 2, label: "Ср", dayOfWeek: 3 },
  { id: 3, label: "Чт", dayOfWeek: 4 },
  { id: 4, label: "Пт", dayOfWeek: 5 },
  { id: 5, label: "Сб", dayOfWeek: 6 },
  { id: 6, label: "Вс", dayOfWeek: 0 },
];

const timeSlots = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

type DaySchedule = {
  dayOfWeek: number;
  time: string;
};

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const { group, isLoading, error, updateGroup } = useGroup(groupId);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "REGULAR" as "REGULAR" | "INTENSIVE",
    pricingType: "FIXED" as "FIXED" | "DYNAMIC",
    fixedPrice: 1000,
    maxStudents: 3,
    daySchedules: [] as DaySchedule[],
    telegramChat: "",
    startsAt: "",
    endsAt: "",
  });

  // Load group data when available
  useEffect(() => {
    if (group) {
      const daySchedules: DaySchedule[] = (group.schedules || []).map(s => ({
        dayOfWeek: s.dayOfWeek,
        time: s.time
      }));
      
      setFormData({
        name: group.name,
        description: group.description || "",
        groupType: (group as any).groupType || "REGULAR",
        pricingType: (group as any).pricingType || "FIXED",
        fixedPrice: (group as any).fixedPrice || 1000,
        maxStudents: group.maxStudents,
        daySchedules,
        telegramChat: group.telegramChat || "",
        startsAt: (group as any).startsAt ? new Date((group as any).startsAt).toISOString().split('T')[0] : "",
        endsAt: (group as any).endsAt ? new Date((group as any).endsAt).toISOString().split('T')[0] : "",
      });
    }
  }, [group]);

  const handleDayToggle = (dayOfWeek: number) => {
    setFormData(prev => {
      const exists = prev.daySchedules.find(d => d.dayOfWeek === dayOfWeek);
      if (exists) {
        return {
          ...prev,
          daySchedules: prev.daySchedules.filter(d => d.dayOfWeek !== dayOfWeek)
        };
      } else {
        return {
          ...prev,
          daySchedules: [...prev.daySchedules, { dayOfWeek, time: "10:00" }]
        };
      }
    });
  };

  const handleTimeChange = (dayOfWeek: number, time: string) => {
    setFormData(prev => ({
      ...prev,
      daySchedules: prev.daySchedules.map(d => 
        d.dayOfWeek === dayOfWeek ? { ...d, time } : d
      )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const schedules = formData.groupType === "REGULAR" 
      ? formData.daySchedules 
      : [];
    
    const result = await updateGroup({
      name: formData.name,
      description: formData.description,
      pricingType: formData.pricingType,
      fixedPrice: formData.fixedPrice,
      maxStudents: formData.maxStudents,
      telegramChat: formData.telegramChat,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      schedules,
    });
    
    if (result.success) {
      toast.success("Группа обновлена");
      router.push(`/groups/${groupId}`);
    } else {
      setIsSaving(false);
      toast.error(result.error || "Ошибка сохранения");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500">{error || "Группа не найдена"}</p>
          <Link href="/groups">
            <Button className="mt-4 bg-[#3BCEAC] hover:bg-[#14B8A6]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к группам
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Редактировать группу</h1>
            <p className="text-sm text-gray-500">{group.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-[#3BCEAC]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Основная информация */}
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

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Тип группы:</strong> {formData.groupType === "REGULAR" ? "Регулярные занятия" : "Интенсив"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Тип группы нельзя изменить после создания
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Минимум учеников *</label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-[#3BCEAC] hover:bg-[#14B8A6]"
              onClick={() => setStep(2)}
              disabled={!formData.name}
            >
              Далее
            </Button>
          </motion.div>
        )}

        {/* Step 2: Расписание и цены */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Ценообразование */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-[#3BCEAC]" />
                  <span className="font-medium">Ценообразование</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingType: "FIXED" })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.pricingType === "FIXED"
                        ? "border-[#3BCEAC] bg-[#F0FDF9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium">Фиксированная</span>
                    <p className="text-xs text-gray-500 mt-1">Списание с баланса</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingType: "DYNAMIC" })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.pricingType === "DYNAMIC"
                        ? "border-[#3BCEAC] bg-[#F0FDF9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium">Динамическая</span>
                    <p className="text-xs text-gray-500 mt-1">Цена после голосования</p>
                  </button>
                </div>

                {formData.pricingType === "FIXED" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Стоимость занятия (₽)</label>
                    <Input
                      type="number"
                      min={100}
                      step={100}
                      placeholder="1000"
                      value={formData.fixedPrice}
                      onChange={(e) => setFormData({ ...formData, fixedPrice: parseInt(e.target.value) || 1000 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Цена за {formData.groupType === "INTENSIVE" ? "весь интенсив" : "одно занятие"}. При голосовании списывается 1 занятие.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Даты для интенсива */}
            {formData.groupType === "INTENSIVE" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Даты интенсива</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Начало</label>
                      <Input
                        type="date"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Окончание</label>
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

            {/* Расписание для регулярных */}
            {formData.groupType === "REGULAR" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#3BCEAC]" />
                    <span className="font-medium">Расписание</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Дни недели *</label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => {
                        const isSelected = formData.daySchedules.some(d => d.dayOfWeek === day.dayOfWeek);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleDayToggle(day.dayOfWeek)}
                            className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                              isSelected
                                ? "bg-[#3BCEAC] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formData.daySchedules.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Время для каждого дня</label>
                      {formData.daySchedules
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((daySchedule) => {
                          const dayLabel = weekDays.find(d => d.dayOfWeek === daySchedule.dayOfWeek)?.label;
                          return (
                            <div key={daySchedule.dayOfWeek} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium w-8">{dayLabel}</span>
                              <select
                                className="flex-1 h-9 rounded-md border border-input bg-white px-3"
                                value={daySchedule.time}
                                onChange={(e) => handleTimeChange(daySchedule.dayOfWeek, e.target.value)}
                              >
                                {timeSlots.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                    </div>
                  )}
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
                className="flex-1 bg-[#3BCEAC] hover:bg-[#14B8A6]"
                onClick={() => setStep(3)}
                disabled={
                  formData.groupType === "REGULAR" && formData.daySchedules.length === 0
                }
              >
                Далее
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Telegram и подтверждение */}
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
                    <p className="text-sm text-gray-500">Для уведомлений группы</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ID чата или ссылка</label>
                  <Input
                    placeholder="-1001234567890 или https://t.me/+xxxx"
                    value={formData.telegramChat}
                    onChange={(e) => setFormData({ ...formData, telegramChat: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Добавьте бота @Yom23_bot в группу и укажите ID чата
                  </p>
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
                    <span className="text-gray-500">Тип:</span>
                    <span className="font-medium">
                      {formData.groupType === "REGULAR" ? "Регулярные занятия" : "Интенсив"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ценообразование:</span>
                    <span className="font-medium">
                      {formData.pricingType === "FIXED" 
                        ? `Фикс. (${formData.fixedPrice}₽)` 
                        : "Динамическое"}
                    </span>
                  </div>
                  {formData.groupType === "REGULAR" && formData.daySchedules.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Расписание:</span>
                      <span className="font-medium text-right">
                        {formData.daySchedules
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map(d => {
                            const day = weekDays.find(wd => wd.dayOfWeek === d.dayOfWeek);
                            return `${day?.label} ${d.time}`;
                          })
                          .join(", ")}
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
                    <span className="font-medium">{formData.maxStudents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={isSaving}
              >
                Назад
              </Button>
              <Button 
                className="flex-1 bg-[#3BCEAC] hover:bg-[#14B8A6]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
