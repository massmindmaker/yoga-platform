"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Wallet, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

interface StudentData {
  id: string;
  firstName: string;
  lastName: string | null;
  balance: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/users?role=STUDENT');
        const json = await res.json();
        if (json.success && json.data) {
          setStudents(json.data);
        } else {
          setError(json.error || "Ошибка загрузки");
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Ошибка сети");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filtered = students.filter(s => {
    const name = `${s.firstName} ${s.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Ученики</h1>
        <p className="text-sm text-gray-500">
          {isLoading ? "Загрузка..." : `Всего: ${students.length} человек`}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Поиск по имени"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((student, index) => (
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
                      <AvatarFallback className="bg-gray-100 text-gray-900 font-medium">
                        {student.firstName[0]}{student.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {student.firstName} {student.lastName || ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Wallet size={14} className="text-gray-900" />
                        <span className={`font-semibold ${student.balance < 3 ? "text-red-500" : "text-gray-900"}`}>
                          {student.balance}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={Users}
            title="Нет учеников"
            description="Ученики появятся после регистрации"
          />
        )}
      </div>
    </div>
  );
}
