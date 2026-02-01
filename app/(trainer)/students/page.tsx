"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Wallet, Calendar } from "lucide-react";

const students = [
  { id: 1, name: "Анна Морозова", balance: 12, lastVisit: "Сегодня", status: "active", phone: "+7 999 123-45-67" },
  { id: 2, name: "Мария Козлова", balance: 5, lastVisit: "Вчера", status: "active", phone: "+7 999 234-56-78" },
  { id: 3, name: "Елена Соколова", balance: 0, lastVisit: "3 дня назад", status: "attention", phone: "+7 999 345-67-89" },
  { id: 4, name: "Ольга Петрова", balance: 8, lastVisit: "Сегодня", status: "active", phone: "+7 999 456-78-90" },
  { id: 5, name: "Наталья Иванова", balance: 3, lastVisit: "Неделю назад", status: "attention", phone: "+7 999 567-89-01" },
  { id: 6, name: "Татьяна Смирнова", balance: 15, lastVisit: "Сегодня", status: "active", phone: "+7 999 678-90-12" },
  { id: 7, name: "Ирина Волкова", balance: 7, lastVisit: "2 дня назад", status: "active", phone: "+7 999 789-01-23" },
  { id: 8, name: "Светлана Лебедева", balance: 1, lastVisit: "5 дней назад", status: "danger", phone: "+7 999 890-12-34" },
];

export default function StudentsPage() {
  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Ученики</h1>
        <p className="text-sm text-gray-500">Всего: {students.length} человек</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input placeholder="Поиск по имени или телефону" className="pl-10" />
      </motion.div>

      <div className="space-y-3">
        {students.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          student.status === "active"
                            ? "bg-green-500"
                            : student.status === "attention"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{student.phone}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Wallet size={14} className="text-purple-600" />
                      <span className={`font-semibold ${student.balance < 3 ? "text-red-500" : "text-gray-900"}`}>
                        {student.balance}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-end text-xs text-gray-500 mt-1">
                      <Calendar size={12} />
                      <span>{student.lastVisit}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
