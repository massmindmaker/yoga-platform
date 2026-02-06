"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

export default function TrainerJournalPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch attendance data from API
    setIsLoading(false);
  }, []);

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
            <EmptyState
              icon={BookOpen}
              title="Нет данных"
              description="Статистика посещаемости появится после проведённых занятий"
            />
          </TabsContent>

          <TabsContent value="classes" className="mt-4 space-y-3">
            <EmptyState
              icon={BookOpen}
              title="Нет занятий"
              description="История занятий появится после проведённых занятий"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
