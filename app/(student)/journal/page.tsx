"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

export default function StudentJournalPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch from /api/bookings?userId=...&status=ATTENDED
    setIsLoading(false);
    setVisits([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Журнал" />

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : visits.length > 0 ? (
          visits.map((visit: any, index: number) => (
            <motion.div
              key={visit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="font-medium text-gray-900">{visit.title}</p>
                  <p className="text-sm text-gray-500">{visit.date}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Нет записей"
            description="История посещений появится после первого занятия"
          />
        )}
      </div>
    </div>
  );
}
