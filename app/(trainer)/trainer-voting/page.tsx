"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { VotingCard } from "@/components/voting/voting-card-new";
import { useVotings } from "@/src/hooks/use-votings";
import { useTelegramUser } from "@/src/hooks/use-telegram-user";

export default function TrainerVotingPage() {
  const router = useRouter();
  const { user } = useTelegramUser();

  // Active votings
  const {
    votings: activeVotings,
    isLoading: isLoadingActive,
    error: activeError,
    finalize,
    cancel,
    remind,
    refetch: refetchActive,
  } = useVotings({ status: "ACTIVE" });

  // Past votings
  const {
    votings: pastVotings,
    isLoading: isLoadingPast,
    error: pastError,
    refetch: refetchPast,
  } = useVotings({ status: "CLOSED,CANCELLED,FINALIZED" });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const error = activeError || pastError;

  const handleCreateClick = () => {
    router.push("/groups");
  };

  const handleFinalize = async (votingId: string) => {
    const result = await finalize(votingId);
    if (result.success) {
      toast.success("Голосование завершено", {
        description: "Результаты опубликованы",
      });
      refetchPast();
    } else {
      toast.error("Ошибка", { description: result.error || "Не удалось завершить голосование" });
    }
  };

  const handleCancel = async (votingId: string) => {
    const result = await cancel(votingId);
    if (result.success) {
      toast.success("Голосование отменено", {
        description: "Средства возвращены участникам",
      });
      refetchPast();
    } else {
      toast.error("Ошибка", { description: result.error || "Не удалось отменить голосование" });
    }
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
            onClick={() => { refetchActive(); refetchPast(); }}
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
            <TabsTrigger value="active">
              Активные {activeVotings.length > 0 && `(${activeVotings.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">
              История {pastVotings.length > 0 && `(${pastVotings.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {isLoadingActive ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#3BCEAC]" />
              </div>
            ) : activeVotings.length > 0 ? (
              activeVotings.map((voting, index) => (
                <motion.div
                  key={voting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VotingCard
                    voting={voting}
                    currentUserId={user?.id}
                    isTrainer={true}
                    onFinalize={handleFinalize}
                    onCancel={handleCancel}
                    expanded={expandedId === voting.id}
                    onExpandChange={(expanded) =>
                      setExpandedId(expanded ? voting.id : null)
                    }
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <p>Нет активных голосований</p>
                <p className="text-sm mt-1">Создайте новое голосование для группы</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {isLoadingPast ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#3BCEAC]" />
              </div>
            ) : pastVotings.length > 0 ? (
              pastVotings.map((voting, index) => (
                <motion.div
                  key={voting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VotingCard
                    voting={voting}
                    currentUserId={user?.id}
                    isTrainer={true}
                    expanded={expandedId === voting.id}
                    onExpandChange={(expanded) =>
                      setExpandedId(expanded ? voting.id : null)
                    }
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                История пуста
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
