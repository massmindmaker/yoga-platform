"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Minus } from "lucide-react";

const weekDays = [
  { id: "mon", label: "Пн", full: "Понедельник" },
  { id: "tue", label: "Вт", full: "Вторник" },
  { id: "wed", label: "Ср", full: "Среда" },
  { id: "thu", label: "Чт", full: "Четверг" },
  { id: "fri", label: "Пт", full: "Пятница" },
  { id: "sat", label: "Сб", full: "Суббота" },
  { id: "sun", label: "Вс", full: "Воскресенье" },
];

const timeSlots = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

// Mock data
const initialData = {
  id: "1",
  name: "Утренняя йога",
  description: "Занятия для начинающих. Фокус на базовых асанах и дыхании.",
  maxStudents: 20,
  telegramChat: "@morning_yoga_group",
  schedule: [
    { day: "mon", time: "07:30" },
    { day: "wed", time: "07:30" },
    { day: "fri", time: "07:30" },
  ]
};

export default function EditGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleScheduleToggle = (dayId: string, time: string) => {
    const exists = formData.schedule.find(s => s.day === dayId && s.time === time);
    
    if (exists) {
      setFormData(prev => ({
        ...prev,
        schedule: prev.schedule.filter(s => !(s.day === dayId && s.time === time))
      }));
    } else {
      // Удаляем другие времена для этого дня
      setFormData(prev => ({
        ...prev,
        schedule: [
          ...prev.schedule.filter(s => s.day !== dayId),
          { day: dayId, time }
        ]
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // TODO: API call
    console.log("Saving:", formData);
    await new Promise(r => setTimeout(r, 500));
    router.push(`/groups/${params.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Редактировать группу"
        backHref={`/groups/${params.id}`}
      />

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Basic Info */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название группы *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Утренняя йога"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Описание
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание группы..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Максимум учеников
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData(prev => ({
                      ...prev, 
                      maxStudents: Math.max(5, prev.maxStudents - 1)
                    }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-8 text-center">
                    {formData.maxStudents}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData(prev => ({
                      ...prev, 
                      maxStudents: Math.min(50, prev.maxStudents + 1)
                    }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Telegram чат
                </label>
                <Input
                  value={formData.telegramChat}
                  onChange={(e) => setFormData({ ...formData, telegramChat: e.target.value })}
                  placeholder="@group_name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Расписание</h3>
              
              <div className="space-y-3">
                {weekDays.map((day) => {
                  const selectedTime = formData.schedule.find(s => s.day === day.id)?.time;
                  
                  return (
                    <div key={day.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{day.full}</span>
                        {selectedTime && (
                          <span className="text-sm text-purple-600 font-medium">
                            {selectedTime}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map((time) => {
                          const isSelected = selectedTime === time;
                          
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleScheduleToggle(day.id, time)}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12"
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить группу
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
