"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, AlertCircle, Users, ChevronRight, Vote } from "lucide-react";
import { useState, useEffect } from "react";
import { VotingCard } from "@/components/voting/voting-card-new";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { useVotings } from "@/src/hooks/use-votings";
import { useTelegramUser } from "@/src/hooks/use-telegram-user";

interface GroupItem {
  id: string;
  name: string;
  groupType: string;
  _count?: { students: number };
}

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
    publishToChat,
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
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Edit voting dialog
  const [editVotingId, setEditVotingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editMinParticipants, setEditMinParticipants] = useState(3);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const error = activeError || pastError;

  const handleCreateClick = () => {
    setShowGroupPicker(true);
    if (groups.length === 0) {
      setIsLoadingGroups(true);
      fetch("/api/groups")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setGroups(data.data);
        })
        .catch(() => toast.error("Не удалось загрузить группы"))
        .finally(() => setIsLoadingGroups(false));
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setShowGroupPicker(false);
    router.push(`/groups/${groupId}/voting/create`);
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

  const handleEdit = (votingId: string) => {
    const voting = [...activeVotings, ...pastVotings].find(v => v.id === votingId);
    if (!voting) return;
    setEditVotingId(votingId);
    setEditTitle(voting.title);
    setEditDeadline(new Date(voting.deadline).toISOString().slice(0, 16));
    setEditMinParticipants(voting.minParticipants);
  };

  const handleSaveEdit = async () => {
    if (!editVotingId) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/votings/${editVotingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          deadline: new Date(editDeadline).toISOString(),
          minParticipants: editMinParticipants,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Голосование обновлено");
        setEditVotingId(null);
        refetchActive();
        refetchPast();
      } else {
        toast.error(data.error || "Ошибка сохранения");
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePublishToChat = async (votingId: string) => {
    const result = await publishToChat(votingId);
    if (result.success) {
      toast.success("Отправлено в чат", {
        description: "Голосование опубликовано в Telegram",
      });
    } else {
      toast.error("Ошибка", { description: result.error || "Не удалось отправить в чат" });
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
        <ErrorFallback 
          error={error} 
          onRetry={() => { refetchActive(); refetchPast(); }} 
        />
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
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать голосование
          </button>
        </motion.div>

        {/* Group Picker Dialog */}
        <Dialog open={showGroupPicker} onOpenChange={setShowGroupPicker}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Выберите группу</DialogTitle>
              <DialogDescription>Для какой группы создать голосование?</DialogDescription>
            </DialogHeader>
            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-base leading-relaxed">Нет доступных групп</p>
                <Button
                  onClick={() => { setShowGroupPicker(false); router.push("/groups/create"); }}
                  className="mt-3 bg-gray-800 hover:bg-black"
                  size="sm"
                >
                  Создать группу
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGroupSelect(g.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-base leading-snug">{g.name}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {g.groupType === "INTENSIVE" ? "Интенсив" : "Регулярная"}
                        {g._count?.students ? ` · ${g._count.students} уч.` : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
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
                    onPublishToChat={handlePublishToChat}
                    onEdit={handleEdit}
                    expanded={expandedId === voting.id}
                    onExpandChange={(expanded) =>
                      setExpandedId(expanded ? voting.id : null)
                    }
                  />
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={Vote}
                title="Нет активных голосований"
                description="Создайте новое голосование для группы"
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {isLoadingPast ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
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
              <EmptyState
                icon={Vote}
                title="История пуста"
                description="Завершённые голосования будут отображаться здесь"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Voting Dialog */}
      <Dialog open={!!editVotingId} onOpenChange={(open) => !open && setEditVotingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Редактировать голосование</DialogTitle>
            <DialogDescription>Измените параметры голосования</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дедлайн</label>
              <Input
                type="datetime-local"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Мин. участников</label>
              <Input
                type="number"
                min={1}
                value={editMinParticipants}
                onChange={(e) => setEditMinParticipants(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditVotingId(null)}
              disabled={isSavingEdit}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editTitle}
              className="bg-gray-800 hover:bg-black"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
