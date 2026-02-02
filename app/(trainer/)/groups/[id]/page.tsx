"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  MessageCircle, 
  Edit, 
  Trash2, 
  ChevronRight,
  Plus,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

// Mock data - в продакшене заменить на API
const groupData = {
  id: "1",
  name: "Утренняя йога",
  description: "Занятия для начинающих. Фокус на базовых асанах и дыхании.",
  schedule: "Пн, Ср, Пт — 7:00",
  students: 18,
  maxStudents: 20,
  telegramChat: "@morning_yoga_group",
  studentsList: [
    { id: "1", name: "Анна М.", initials: "АМ", balance: 5 },
    { id: "2", name: "Мария К.", initials: "МК", balance: 3 },
    { id: "3", name: "Елена С.", initials: "ЕС", balance: 8 },
    { id: "4", name: "Ольга П.", initials: "ОП", balance: 2 },
  ]
};

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "students">("info");

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title={groupData.name}
        backHref="/groups"
      />

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "info"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Информация
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "students"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Ученики ({groupData.students})
          </button>
        </div>

        {/* Info Tab */}
        {activeTab === "info" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Main Info Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Описание</label>
                  <p className="text-gray-900">{groupData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Расписание</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Clock className="w-4 h-4 text-purple-600" />
                      {groupData.schedule}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Ученики</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Users className="w-4 h-4 text-purple-600" />
                      {groupData.students} / {groupData.maxStudents}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Telegram чат</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <a 
                      href={`https://t.me/${groupData.telegramChat.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {groupData.telegramChat}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Занятий на этой неделе</p>
                  <p className="text-2xl font-bold text-purple-700">3</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Средняя посещаемость</p>
                  <p className="text-2xl font-bold text-green-700">85%</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/groups/${params.id}/edit`}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-12"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать группу
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Удалить группу
              </Button>
            </div>
          </motion.div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Button 
              variant="outline" 
              className="w-full justify-center gap-2 h-12 border-dashed border-2"
            >
              <Plus className="w-4 h-4" />
              Добавить ученика
            </Button>

            {groupData.studentsList.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                            {student.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">
                            Баланс: {student.balance} занятий
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
