"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Mock история посещений
const visits = [
  { id: "1", date: "2026-01-30", title: "Утренняя йога", trainer: "Ирина", status: "attended" },
  { id: "2", date: "2026-01-28", title: "Виньяса-флоу", trainer: "Мария", status: "attended" },
  { id: "3", date: "2026-01-25", title: "Хатха-йога", trainer: "Ирина", status: "missed" },
  { id: "4", date: "2026-01-23", title: "Растяжка", trainer: "Елена", status: "attended" },
  { id: "5", date: "2026-01-21", title: "Медитация", trainer: "Мария", status: "attended" },
];

export default function StudentJournalPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Журнал" />

      <div className="p-4 space-y-3">
        {visits.map((visit, index) => (
          <motion.div
            key={visit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{visit.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(visit.date), "d MMMM", { locale: ru })} · {visit.trainer}
                    </p>
                  </div>
                  <div>
                    {visit.status === "attended" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Был</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm">Пропуск</span>
                      </div>
                    )}
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
