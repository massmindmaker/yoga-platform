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
import { ArrowLeft, Loader2, Calendar, Vote, CreditCard, AlertCircle } from "lucide-react";
import { useGroup } from "@/src/hooks/use-groups";

type VotingPeriod = "daily" | "weekly";
type PricingMode = "balance" | "payment" | "free";

const weekDays = [
  { id: 0, label: "Пн", dayOfWeek: 1 },
  { id: 1, label: "Вт", dayOfWeek: 2 },
  { id: 2, label: "Ср", dayOfWeek: 3 },
  { id: 3, label: "Чт", dayOfWeek: 4 },
  { id: 4, label: "Пт", dayOfWeek: 5 },
  { id: 5, label: "Сб", dayOfWeek: 6 },
  { id: 6, label: "Вс", dayOfWeek: 0 },
];

export default function CreateVotingPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const { group, isLoading, error } = useGroup(groupId);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "weekly" as VotingPeriod,
    pricingMode: "balance" as PricingMode,
    selectedDays: [] as number[],
    deadline: "",
  });

  // Автозаполнение дней из расписания группы
  useEffect(() => {
    if (group?.schedules) {
      const days = group.schedules.map(s => s.dayOfWeek);
      setFormData(prev => ({ ...prev, selectedDays: days }));
    }
  }, [group]);

  const handleDayToggle = (dayOfWeek: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayOfWeek)
        ? prev.selectedDays.filter(d => d !== dayOfWeek)
        : [...prev.selectedDays, dayOfWeek]
    }));
  };

  const handleCreate = async () => {
    setIsSaving(true);
    
    try {
      // Создаём голосование через API
      const response = await fetch("/api/votings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title: formData.title,
          type: formData.period === "daily" ? "CONFIRM" : "SCHEDULE",
          chargeOnVote: formData.pricingMode === "balance",
          multipleChoice: formData.period === "weekly",
          minParticipants: group?.maxStudents || 3,
          deadline: new Date(formData.deadline).toISOString(),
          options: formData.selectedDays.map(dayOfWeek => {
            const schedule = group?.schedules.find(s => s.dayOfWeek === dayOfWeek);
            return {
              dayOfWeek,
              time: schedule?.time || "10:00",
              description: formData.description,
            };
          }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Голосование создано");
        router.push(`/groups/${groupId}`);
      } else {
        throw new Error(result.error || "Ошибка создания");
      }
    } catch (err: any) {
      toast.error(err.message || "Ошибка создания голосования");
    } finally {
      setIsSaving(false);
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

  // Check if group has Telegram chat
  if (!group.telegramChat) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Telegram чат не привязан</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Для создания голосования необходимо привязать Telegram чат к группе. 
            Голосование публикуется в чат группы.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/groups/${groupId}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <Link href={`/groups/${groupId}/edit`}>
              <Button className="bg-[#3BCEAC] hover:bg-[#14B8A6]">
                Привязать чат
              </Button>
            </Link>
          </div>
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
            <h1 className="text-lg font-bold">Создать голосование</h1>
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
                  <label className="block text-sm font-medium mb-1">Название голосования *</label>
                  <Input
                    placeholder="Например: Расписание на неделю"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Описание (опционально)</label>
                  <Textarea
                    placeholder="Дополнительная информация для учеников..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Период голосования *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, period: "daily" })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.period === "daily"
                          ? "border-[#3BCEAC] bg-[#F0FDF9]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-[#3BCEAC]" />
                      <span className="text-sm font-medium">На день</span>
                      <p className="text-xs text-gray-500 mt-1">Голосование на каждый день</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, period: "weekly" })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.period === "weekly"
                          ? "border-[#3BCEAC] bg-[#F0FDF9]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                      <span className="text-sm font-medium">На неделю</span>
                      <p className="text-xs text-gray-500 mt-1">Расписание на всю неделю</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Дедлайн голосования *</label>
                  <Input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    До какого времени можно голосовать
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-[#3BCEAC] hover:bg-[#14B8A6]"
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.deadline}
            >
              Далее
            </Button>
          </motion.div>
        )}

        {/* Step 2: Выбор дней */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Vote className="w-5 h-5 text-[#3BCEAC]" />
                  <span className="font-medium">Дни для голосования</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.period === "daily" 
                      ? "Выберите день" 
                      : "Выберите дни недели *"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          if (formData.period === "daily") {
                            setFormData({ ...formData, selectedDays: [day.dayOfWeek] });
                          } else {
                            handleDayToggle(day.dayOfWeek);
                          }
                        }}
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                          formData.selectedDays.includes(day.dayOfWeek)
                            ? "bg-[#3BCEAC] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.period === "daily" 
                      ? "Ученики проголосуют за конкретный день"
                      : "Ученики смогут выбрать несколько дней"}
                  </p>
                </div>

                {formData.selectedDays.length > 0 && (
                  <div className="bg-[#F0FDF9] p-3 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Выбрано:</strong>{" "}
                      {formData.selectedDays
                        .sort((a, b) => a - b)
                        .map(d => weekDays.find(wd => wd.dayOfWeek === d)?.label)
                        .join(", ")}
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
                className="flex-1 bg-[#3BCEAC] hover:bg-[#14B8A6]"
                onClick={() => setStep(3)}
                disabled={formData.selectedDays.length === 0}
              >
                Далее
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Оплата */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-[#3BCEAC]" />
                  <span className="font-medium">Оплата</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingMode: "balance" })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.pricingMode === "balance"
                        ? "border-[#3BCEAC] bg-[#F0FDF9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-[#3BCEAC]" />
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-1">Списание с баланса</span>
                        <p className="text-xs text-gray-500">
                          При голосовании списывается 1 занятие с баланса ученика
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingMode: "payment" })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.pricingMode === "payment"
                        ? "border-[#3BCEAC] bg-[#F0FDF9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-1">Оплата картой</span>
                        <p className="text-xs text-gray-500">
                          После голосования тренер назначит цену, ученик оплатит картой
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pricingMode: "free" })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.pricingMode === "free"
                        ? "border-[#3BCEAC] bg-[#F0FDF9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Vote className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-1">Без оплаты</span>
                        <p className="text-xs text-gray-500">
                          Просто опрос без списания занятий или оплаты
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {(group as any)?.pricingType === "FIXED" && formData.pricingMode === "balance" && (
                  <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Группа с фиксированной ценой. При голосовании будет списано 1 занятие с баланса ({(group as any)?.fixedPrice || 1000}₽)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="font-medium mb-3">Итоговая информация:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Название:</span>
                    <span className="font-medium">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Период:</span>
                    <span className="font-medium">
                      {formData.period === "daily" ? "На день" : "На неделю"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Дни:</span>
                    <span className="font-medium text-right">
                      {formData.selectedDays
                        .sort((a, b) => a - b)
                        .map(d => weekDays.find(wd => wd.dayOfWeek === d)?.label)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Дедлайн:</span>
                    <span className="font-medium">
                      {new Date(formData.deadline).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Оплата:</span>
                    <span className="font-medium">
                      {formData.pricingMode === "balance" && "Списание с баланса"}
                      {formData.pricingMode === "payment" && "Оплата картой"}
                      {formData.pricingMode === "free" && "Без оплаты"}
                    </span>
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
                onClick={handleCreate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  "Создать голосование"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
