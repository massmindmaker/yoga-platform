"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Users, Clock, Loader2, CheckCircle2, XCircle, Trophy, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTelegramUser } from "@/src/hooks/use-telegram-user";

interface VotingOption {
  id: string;
  dayOfWeek: number;
  time: string;
  description: string | null;
  _count: { votes: number };
}

interface Voting {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  minParticipants: number;
  status: "ACTIVE" | "CLOSED" | "CANCELLED" | "FINALIZED";
  type: string;
  chargeOnVote: boolean;
  options: VotingOption[];
  _count: { votes: number };
  group: {
    id: string;
    name: string;
  };
  createdAt: string;
}

const DAYS_OF_WEEK = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export default function TrainerVotingPage() {
  const router = useRouter();
  const { user } = useTelegramUser();
  const [activeVotings, setActiveVotings] = useState<Voting[]>([]);
  const [pastVotings, setPastVotings] = useState<Voting[]>([]);
  const [isLoadingActive, setIsLoadingActive] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<string | null>(null);

  const fetchVotings = useCallback(async () => {
    try {
      setIsLoadingActive(true);
      setIsLoadingPast(true);
      setError(null);

      // Fetch active votings
      const activeResponse = await fetch("/api/votings?status=ACTIVE");
      const activeData = await activeResponse.json();

      if (activeData.success) {
        setActiveVotings(activeData.data);
      } else {
        setError(activeData.error || "Ошибка загрузки активных голосований");
      }

      // Fetch past votings
      const pastResponse = await fetch("/api/votings?status=CLOSED,CANCELLED,FINALIZED");
      const pastData = await pastResponse.json();

      if (pastData.success) {
        setPastVotings(pastData.data);
      } else {
        setError(pastData.error || "Ошибка загрузки истории");
      }
    } catch (err) {
      setError("Ошибка сети");
      console.error("Error fetching votings:", err);
    } finally {
      setIsLoadingActive(false);
      setIsLoadingPast(false);
    }
  }, []);

  useEffect(() => {
    fetchVotings();
  }, [fetchVotings]);

  const handleCreateClick = () => {
    // Navigate to the first group or show group selection
    // For now, navigate to groups page to select a group
    router.push("/groups");
  };

  const handleRemind = async (votingId: string) => {
    setActionLoading(`remind-${votingId}`);
    try {
      const response = await fetch(`/api/votings/${votingId}/remind`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Напоминание отправлено", {
          description: "Уведомление отправлено в Telegram",
        });
      } else {
        toast.error("Ошибка", { description: data.error || "Не удалось отправить напоминание" });
      }
    } catch (err) {
      toast.error("Ошибка сети", { description: "Не удалось отправить напоминание" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalize = async (votingId: string) => {
    setActionLoading(`finalize-${votingId}`);
    try {
      const response = await fetch(`/api/votings/${votingId}/finalize`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Голосование завершено", {
          description: "Результаты опубликованы",
        });
        await fetchVotings();
      } else {
        toast.error("Ошибка", { description: data.error || "Не удалось завершить голосование" });
      }
    } catch (err) {
      toast.error("Ошибка сети", { description: "Не удалось завершить голосование" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (votingId: string) => {
    setActionLoading(`cancel-${votingId}`);
    try {
      const response = await fetch(`/api/votings/${votingId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Голосование отменено", {
          description: "Средства возвращены участникам",
        });
        await fetchVotings();
      } else {
        toast.error("Ошибка", { description: data.error || "Не удалось отменить голосование" });
      }
    } catch (err) {
      toast.error("Ошибка сети", { description: "Не удалось отменить голосование" });
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return "Голосование закрыто";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} дн ${hours} ч`;
    return `${hours} ч`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
            Идет
          </div>
        );
      case "FINALIZED":
        return (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            Завершено
          </div>
        );
      case "CLOSED":
        return (
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
            Закрыто
          </div>
        );
      case "CANCELLED":
        return (
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
            Отменено
          </div>
        );
      default:
        return null;
    }
  };

  const isSuccessful = (voting: Voting) => {
    return voting._count.votes >= voting.minParticipants;
  };

  if (isLoadingActive && isLoadingPast) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <div className="p-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <Button
            onClick={fetchVotings}
            className="mt-4 bg-[#3BCEAC] hover:bg-[#2A9D8F]"
          >
            Повторить
          </Button>
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
            onClick={handleCreateClick}
            className="w-full py-4 border-2 border-dashed border-[#3BCEAC]/40 rounded-2xl text-[#3BCEAC] font-medium hover:border-[#3BCEAC] hover:bg-[#F0FDF9] transition-all flex items-center justify-center gap-2"
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
            {isLoadingActive ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#3BCEAC]" />
              </div>
            ) : (
              <>
                {activeVotings.map((voting, index) => (
                  <motion.div
                    key={voting.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{voting.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{voting.group.name}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {getTimeLeft(voting.deadline)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {voting._count.votes}/{voting.minParticipants}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(voting.status)}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                isSuccessful(voting)
                                  ? "bg-gradient-to-r from-green-400 to-green-500"
                                  : "bg-gradient-to-r from-orange-400 to-orange-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((voting._count.votes / voting.minParticipants) * 100, 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {isSuccessful(voting)
                              ? "✅ Минимум набран!"
                              : `Нужно еще ${voting.minParticipants - voting._count.votes} человек`
                            }
                          </p>
                        </div>

                        {/* Options preview */}
                        {voting.options.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {voting.options.slice(0, 3).map((option) => (
                              <span
                                key={option.id}
                                className="text-xs bg-gray-100 px-2 py-1 rounded-lg"
                              >
                                {DAYS_OF_WEEK[option.dayOfWeek]}, {option.time}
                              </span>
                            ))}
                            {voting.options.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{voting.options.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Results Modal */}
                        {showResults === voting.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 bg-gray-50 rounded-xl p-4"
                          >
                            <h4 className="font-medium text-sm mb-3">Результаты голосования:</h4>
                            <div className="space-y-2">
                              {voting.options.map((option) => (
                                <div key={option.id} className="flex items-center justify-between text-sm">
                                  <span>{DAYS_OF_WEEK[option.dayOfWeek]}, {option.time}</span>
                                  <span className="font-medium">{option._count.votes} голосов</span>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() => setShowResults(null)}
                            >
                              Скрыть
                            </Button>
                          </motion.div>
                        )}

                        <div className="mt-4 flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowResults(showResults === voting.id ? null : voting.id)}
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            {showResults === voting.id ? "Скрыть" : "Результаты"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRemind(voting.id)}
                            disabled={actionLoading === `remind-${voting.id}`}
                          >
                            {actionLoading === `remind-${voting.id}` ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <MessageCircle className="w-4 h-4 mr-1" />
                            )}
                            Напомнить
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleFinalize(voting.id)}
                            disabled={actionLoading === `finalize-${voting.id}`}
                          >
                            {actionLoading === `finalize-${voting.id}` ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            Завершить
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleCancel(voting.id)}
                            disabled={actionLoading === `cancel-${voting.id}`}
                          >
                            {actionLoading === `cancel-${voting.id}` ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            Отменить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {activeVotings.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500"
                  >
                    <p>Нет активных голосований</p>
                    <p className="text-sm mt-1">Создайте новое голосование для группы</p>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {isLoadingPast ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#3BCEAC]" />
              </div>
            ) : (
              <>
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
                            <p className="text-sm text-gray-500 mt-1">{voting.group.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(voting.deadline).toLocaleDateString("ru-RU")}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              <Users className="w-4 h-4" />
                              {voting._count.votes} голосов
                            </div>
                          </div>
                          {getStatusBadge(voting.status)}
                        </div>

                        {/* Results summary */}
                        {voting.options.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Результаты:</p>
                            <div className="space-y-1">
                              {voting.options
                                .sort((a, b) => b._count.votes - a._count.votes)
                                .slice(0, 2)
                                .map((option) => (
                                  <div key={option.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                      {DAYS_OF_WEEK[option.dayOfWeek]}, {option.time}
                                    </span>
                                    <span className="font-medium">{option._count.votes}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {pastVotings.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500"
                  >
                    История пуста
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
