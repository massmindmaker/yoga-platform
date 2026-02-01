"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { CreateVotingForm } from "@/components/voting/voting-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Users, Clock } from "lucide-react";
import { useState } from "react";

// Mock data
const activeVotings = [
  {
    id: "1",
    title: "Йога в пятницу",
    deadline: "2026-02-06T18:00:00",
    minParticipants: 10,
    currentVotes: 8,
    status: "active" as const,
  },
];

const pastVotings = [
  {
    id: "2",
    title: "Онлайн на неделю",
    deadline: "2026-01-30T22:00:00",
    minParticipants: 5,
    currentVotes: 12,
    status: "completed" as const,
    result: "success" as const,
  },
];

export default function TrainerVotingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Новое голосование"
          backHref="/voting"
        />
        <div className="p-4">
          <CreateVotingForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Голосования" />

      <div className="p-4 space-y-4">
        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-4 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 font-medium hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать голосование
          </button>
        </motion.div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="past">История</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeVotings.map((voting, index) => (
              <motion.div
                key={voting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{voting.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            До {new Date(voting.deadline).toLocaleDateString("ru-RU")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {voting.currentVotes}/{voting.minParticipants}
                          </span>
                        </div>
                      </div>
                      <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                        Идет
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Результаты
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Напомнить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {activeVotings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Нет активных голосований
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {pastVotings.map((voting, index) => (
              <motion.div
                key={voting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{voting.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(voting.deadline).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        voting.result === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {voting.result === "success" ? "Состоялось" : "Отменено"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {pastVotings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                История пуста
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
