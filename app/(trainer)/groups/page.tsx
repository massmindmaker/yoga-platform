"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const groups = [
  {
    id: "1",
    name: "Утренняя йога",
    schedule: "Пн, Ср, Пт — 7:00",
    students: 18,
    maxStudents: 20,
    level: "Начинающие",
    color: "bg-orange-100",
    textColor: "text-orange-600",
  },
  {
    id: "2",
    name: "Вечерний поток",
    schedule: "Вт, Чт — 19:00",
    students: 15,
    maxStudents: 18,
    level: "Средний",
    color: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    id: "3",
    name: "Интенсив выходного дня",
    schedule: "Сб — 10:00",
    students: 12,
    maxStudents: 15,
    level: "Продвинутый",
    color: "bg-green-100",
    textColor: "text-green-600",
  },
];

const avatars = ["АМ", "МК", "ЕС", "ОП", "+14"];

export default function GroupsPage() {
  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Мои группы</h1>
          <span className="text-sm text-gray-500">{groups.length} групп</span>
        </div>
        <Link href="/groups/create">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-1" />
            Создать
          </Button>
        </Link>
      </motion.div>

      <div className="space-y-3">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/groups/${group.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <Badge variant="secondary" className={`${group.color} ${group.textColor} border-0`}>
                          {group.level}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{group.schedule}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{group.students}/{group.maxStudents}</span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {avatars.slice(0, 4).map((avatar, i) => (
                            <Avatar key={i} className="w-7 h-7 border-2 border-white">
                              <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                {avatar}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">{avatars[4]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-purple-400 hover:text-purple-600 transition-colors">
          + Создать новую группу
        </button>
      </motion.div>
    </div>
  );
}
