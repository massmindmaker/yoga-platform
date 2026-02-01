"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Users, Calendar, Wallet } from "lucide-react";

// Mock данные студентов с посещаемостью
const studentsAttendance = [
  { id: "1", name: "Анна Морозова", total: 12, attended: 10, missed: 2, percent: 83 },
  { id: "2", name: "Мария Козлова", total: 12, attended: 11, missed: 1, percent: 92 },
  { id: "3", name: "Елена Соколова", total: 12, attended: 8, missed: 4, percent: 67 },
  { id: "4", name: "Ольга Петрова", total: 12, attended: 12, missed: 0, percent: 100 },
  { id: "5", name: "Наталья Иванова", total: 12, attended: 9, missed: 3, percent: 75 },
];

// Mock данные посещений по тренировкам
const classAttendance = [
  { id: "1", date: "30.01", title: "Утренняя йога", students: 8, expected: 10, revenue: 8000 },
  { id: "2", date: "29.01", title: "Вечерний поток", students: 12, expected: 12, revenue: 12000 },
  { id: "3", date: "28.01", title: "Виньяса-флоу", students: 6, expected: 8, revenue: 6000 },
  { id: "4", date: "27.01", title: "Хатха-йога", students: 10, expected: 10, revenue: 10000 },
  { id: "5", date: "25.01", title: "Растяжка", students: 7, expected: 8, revenue: 7000 },
];

export default function TrainerJournalPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Журнал" />

      <div className="p-4">
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Студенты</TabsTrigger>
            <TabsTrigger value="classes">Посещения</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4 space-y-3">
            {studentsAttendance.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            {student.attended}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-4 h-4" />
                            {student.missed}
                          </span>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        student.percent >= 80 ? "text-green-600" : 
                        student.percent >= 60 ? "text-yellow-600" : "text-red-500"
                      }`}>
                        {student.percent}%
                      </span>
                    </div>
                    <Progress value={student.percent} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="classes" className="mt-4 space-y-3">
            {classAttendance.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{cls.title}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {cls.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {cls.students}/{cls.expected}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <Wallet className="w-4 h-4" />
                          {cls.revenue.toLocaleString()} ₽
                        </div>
                        <p className="text-xs text-gray-500">
                          {Math.round((cls.students / cls.expected) * 100)}% заполняемость
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
