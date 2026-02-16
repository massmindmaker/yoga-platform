"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Clock,
  MessageCircle,
  Loader2,
  Calendar,
  Vote,
  RefreshCw,
  Send,
  MoreVertical,
} from "lucide-react";
import { useGroup } from "@/src/hooks/use-groups";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VotingCard } from "@/components/voting/voting-card-new";

const DAYS_OF_WEEK = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { group, isLoading, error, deleteGroup } = useGroup(groupId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedVoting, setExpandedVoting] = useState<string | null>(null);
  const [publishingVotingId, setPublishingVotingId] = useState<string | null>(null);

  // Edit voting dialog
  const [editVotingId, setEditVotingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editMinParticipants, setEditMinParticipants] = useState(3);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleEditVoting = (votingId: string) => {
    const voting = (group?.votings || []).find((v: any) => v.id === votingId);
    if (!voting) return;
    setEditVotingId(votingId);
    setEditTitle(voting.title);
    setEditDeadline(new Date(voting.deadline).toISOString().slice(0, 16));
    setEditMinParticipants(voting.minParticipants);
  };

  const handleSaveEditVoting = async () => {
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
        window.location.reload();
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
    setPublishingVotingId(votingId);
    try {
      const res = await fetch(`/api/votings/${votingId}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Отправлено в чат", {
          description: "Голосование опубликовано в Telegram",
        });
      } else {
        toast.error(data.error || "Не удалось отправить в чат");
      }
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setPublishingVotingId(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteGroup();
    if (result.success) {
      router.push("/groups");
    } else {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      toast.error(result.error || "Ошибка удаления группы");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error || "Группа не найдена"}</p>
        <Link href="/groups">
          <Button className="mt-4 bg-gray-800 hover:bg-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к группам
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Link href="/groups">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{group.name}</h1>
            <p className="text-base text-gray-500 leading-relaxed">
              {group._count.students} учеников
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/groups/${group.id}/edit`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Edit className="w-5 h-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
              {group.description && (
              <p className="text-gray-600 text-base leading-relaxed">{group.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className="text-base text-gray-500 leading-relaxed">Мин. для старта</p>
                  <p className="font-bold">
                    {group.maxStudents} учеников
                  </p>
                </div>
              </div>

              {group.telegramChat && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                  <p className="text-base text-gray-500 leading-relaxed">Telegram чат</p>
                  <p className="font-bold text-base truncate max-w-[120px]">
                    {group.telegramChat}
                  </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule — только для REGULAR групп */}
      {group.groupType !== "INTENSIVE" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Расписание
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {group.schedules.length === 0 ? (
                <p className="text-gray-500 text-base leading-relaxed">Расписание не задано</p>
              ) : (
                <div className="space-y-2">
                  {group.schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-base font-bold text-gray-900">
                            {DAYS_SHORT[schedule.dayOfWeek]}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-base">
                            {DAYS_OF_WEEK[schedule.dayOfWeek]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold text-base">{schedule.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Votings — using shared VotingCard component */}
      {group.votings && group.votings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="space-y-3">
            {group.votings.map((voting: any) => {
              // Map group data into voting for VotingCard
              const votingWithGroup = {
                ...voting,
                group: {
                  id: group.id,
                  name: group.name,
                  pricingType: group.pricingType,
                  fixedPrice: group.fixedPrice,
                },
                createdAt: voting.createdAt || new Date().toISOString(),
              };

              return (
                <VotingCard
                  key={voting.id}
                  voting={votingWithGroup}
                  isTrainer={true}
                  onPublishToChat={handlePublishToChat}
                  onEdit={handleEditVoting}
                  onCancel={async (id) => {
                    if (!confirm("Отменить голосование? Баланс будет возвращён участникам.")) return;
                    try {
                      const res = await fetch(`/api/votings/${id}/cancel`, { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Голосование отменено");
                        window.location.reload();
                      } else {
                        toast.error(data.error || "Ошибка отмены");
                      }
                    } catch {
                      toast.error("Ошибка отмены голосования");
                    }
                  }}
                  onFinalize={async (id) => {
                    try {
                      const res = await fetch(`/api/votings/${id}/finalize`, { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Голосование завершено");
                        window.location.reload();
                      } else {
                        toast.error(data.error || "Ошибка завершения");
                      }
                    } catch {
                      toast.error("Ошибка завершения голосования");
                    }
                  }}
                  expanded={expandedVoting === voting.id}
                  onExpandChange={(expanded) => setExpandedVoting(expanded ? voting.id : null)}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Students Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ученики ({group._count.students})
              </CardTitle>
            {group.telegramChat && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/groups/${groupId}/sync-telegram`, {
                        method: 'POST'
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast.success(data.message || 'Ученики синхронизированы');
                        window.location.reload();
                      } else {
                        toast.error(data.error || 'Ошибка синхронизации');
                      }
                    } catch (error) {
                      toast.error('Ошибка синхронизации');
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Синхронизировать
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/groups/${groupId}/sync-telegram?action=reconnect`, {
                        method: 'POST'
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast.success(data.message);
                      } else {
                        toast.error(data.error || 'Ошибка');
                      }
                    } catch {
                      toast.error('Ошибка переподключения');
                    }
                  }}
                >
                  Переподключить
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {group._count.students === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4 text-base leading-relaxed">В группе пока нет учеников</p>
                {group.telegramChat ? (
                  <p className="text-base text-gray-400 leading-relaxed">
                    Нажмите "Синхронизировать" для загрузки учеников из Telegram чата
                  </p>
                ) : (
                  <p className="text-base text-gray-400 leading-relaxed">
                    Привяжите Telegram чат к группе для автоматической загрузки учеников
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {group.students?.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Avatar className="w-10 h-10">
                      {student.user?.photoUrl && (
                        <img src={student.user.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                      )}
                      <AvatarFallback className="bg-gray-100 text-gray-900">
                        {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">
                        {student.user?.firstName} {student.user?.lastName}
                      </p>
                      <p className="text-base text-gray-500 leading-relaxed">
                        Баланс: {student.user?.balance || 0} занятий
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link href={`/groups/${group.id}/voting/create`}>
          <Button className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:bg-black text-white justify-center text-center">
            <Vote className="w-4 h-4 mr-2" />
            Создать голосование
          </Button>
        </Link>
      </motion.div>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дедлайн</label>
              <Input
                type="datetime-local"
                value={editDeadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Мин. участников</label>
              <Input
                type="number"
                min={1}
                value={editMinParticipants}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMinParticipants(parseInt(e.target.value) || 1)}
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
              onClick={handleSaveEditVoting}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить группу?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить группу &quot;{group.name}&quot;? Это
              действие нельзя отменить. Все данные о занятиях и записях будут
              сохранены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
