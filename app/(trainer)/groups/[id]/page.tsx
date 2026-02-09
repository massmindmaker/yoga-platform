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
} from "lucide-react";
import { useGroup } from "@/src/hooks/use-groups";
import { ChevronDown, ChevronUp } from "lucide-react";

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
        <Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error || "Группа не найдена"}</p>
        <Link href="/groups">
          <Button className="mt-4 bg-[#3BCEAC] hover:bg-[#14B8A6]">
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
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">
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
              <p className="text-gray-600">{group.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#3BCEAC]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Мин. для старта</p>
                  <p className="font-semibold">
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
                    <p className="text-sm text-gray-500">Telegram чат</p>
                    <p className="font-semibold text-sm truncate max-w-[120px]">
                      {group.telegramChat}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Расписание
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {group.schedules.length === 0 ? (
              <p className="text-gray-500 text-sm">Расписание не задано</p>
            ) : (
              <div className="space-y-2">
                {group.schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                      <span className="text-sm font-medium text-[#3BCEAC]">
                          {DAYS_SHORT[schedule.dayOfWeek]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {DAYS_OF_WEEK[schedule.dayOfWeek]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{schedule.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Votings */}
      {(group as any).votings && (group as any).votings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Vote className="w-4 h-4" />
                Активные голосования
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {(group as any).votings.map((voting: any) => {
                  const totalVotes = voting._count.votes;
                  const progress = Math.round((totalVotes / voting.minParticipants) * 100);
                  const isActive = voting.status === 'ACTIVE';
                  const isExpanded = expandedVoting === voting.id;
                  
                  // Получаем уникальных проголосовавших пользователей
                  const votersMap = new Map();
                  voting.options?.forEach((option: any) => {
                    option.votes?.forEach((vote: any) => {
                      if (vote.user && !votersMap.has(vote.user.id)) {
                        votersMap.set(vote.user.id, vote.user);
                      }
                    });
                  });
                  const uniqueVoters = Array.from(votersMap.values());
                  
                  return (
                    <div
                      key={voting.id}
                      className={`p-3 bg-gradient-to-r from-[#F0FDF9] to-[#CCFBF1] rounded-lg border border-[#CCFBF1] cursor-pointer transition-all ${isExpanded ? 'ring-2 ring-[#2DD4BF]' : ''}`}
                      onClick={() => setExpandedVoting(isExpanded ? null : voting.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{voting.title}</h4>
                            {isExpanded && isActive && (
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Отменить голосование? Баланс будет возвращён участникам.")) return;
                                    try {
                                      const res = await fetch(`/api/votings/${voting.id}/cancel`, { method: "POST" });
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
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            До {new Date(voting.deadline).toLocaleDateString("ru-RU", { 
                              day: "numeric", 
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActive 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {isActive ? "Активно" : "Завершено"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Проголосовало</span>
                            <span className="text-xs font-medium text-[#3BCEAC]">
                              {totalVotes}/{voting.minParticipants} ({progress}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-gradient-to-r from-[#3BCEAC] to-[#2DD4BF] transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          
                          {/* Миниатюрные аватарки проголосовавших */}
                          {uniqueVoters.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <div className="flex -space-x-2">
                                {uniqueVoters.slice(0, 5).map((voter: any, idx: number) => (
                                  <Avatar key={voter.id} className="w-6 h-6 border-2 border-white">
                                    <AvatarFallback className="text-[10px] bg-[#CCFBF1] text-[#3BCEAC]">
                                      {voter.firstName?.[0]}{voter.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              {uniqueVoters.length > 5 && (
                                <span className="text-xs text-gray-500 ml-1">+{uniqueVoters.length - 5}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Развернутая информация */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-[#CCFBF1]"
                        >
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Результаты голосования:</h5>
                          <div className="space-y-2">
                            {voting.options?.map((option: any) => {
                              const optionVotes = option.votes?.length || 0;
                              const optionProgress = voting.minParticipants > 0 
                                ? Math.round((optionVotes / voting.minParticipants) * 100) 
                                : 0;
                              
                              return (
                                <div key={option.id} className="bg-white/50 rounded-lg p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">
                                      {DAYS_SHORT[option.dayOfWeek]} {option.time}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {optionVotes} голосов
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#2DD4BF] rounded-full"
                                      style={{ width: `${Math.min(optionProgress, 100)}%` }}
                                    />
                                  </div>
                                  {/* Список проголосовавших за этот вариант */}
                                  {option.votes?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {option.votes.map((vote: any) => (
                                        vote.user && (
                                          <span key={vote.id} className="text-xs bg-[#CCFBF1] text-[#3BCEAC] px-2 py-0.5 rounded-full">
                                            {vote.user.firstName} {vote.user.lastName?.[0]}.
                                          </span>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Ученики ({group._count.students})
            </CardTitle>
            {group.telegramChat && (
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
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {group._count.students === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">В группе пока нет учеников</p>
                {group.telegramChat ? (
                  <p className="text-sm text-gray-400">
                    Нажмите "Синхронизировать" для загрузки учеников из Telegram чата
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Привяжите Telegram чат к группе для автоматической загрузки учеников
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(group as any).students?.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#CCFBF1] text-[#3BCEAC]">
                        {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {student.user?.firstName} {student.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
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
        className="pt-4"
      >
        <Link href={`/groups/${group.id}/voting/create`}>
          <Button className="w-full bg-gradient-to-r from-[#3BCEAC] to-[#2DD4BF] hover:from-[#2DD4BF] hover:to-[#3BCEAC] text-white">
            <Vote className="w-4 h-4 mr-2" />
            Создать голосование
          </Button>
        </Link>
      </motion.div>

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
