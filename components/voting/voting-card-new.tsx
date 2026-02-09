"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Trash2,
  MoreVertical,
  Calendar,
  Wallet,
  MessageSquare,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack, UserAvatar } from "@/components/ui/user-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface VoteUser {
  id: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string | null;
  balance?: number;
}

interface VotingOption {
  id: string;
  dayOfWeek: number;
  time: string;
  date?: string | null;
  description?: string | null;
  finalPrice?: number | null;
  _count?: { votes: number };
  votes?: Array<{
    id: string;
    userId: string;
    balanceCharged: boolean;
    user: VoteUser;
  }>;
}

export interface VotingData {
  id: string;
  title: string;
  type: "SCHEDULE" | "CONFIRM" | "SURVEY";
  status: "ACTIVE" | "FINALIZED" | "CLOSED" | "CANCELLED";
  chargeOnVote: boolean;
  multipleChoice: boolean;
  minParticipants: number;
  deadline: string;
  weekStart?: string | null;
  weekEnd?: string | null;
  telegramPollId?: string | null;
  createdAt: string;
  group?: {
    id: string;
    name: string;
    pricingType: "FIXED" | "DYNAMIC";
    fixedPrice?: number;
  };
  options: VotingOption[];
  _count?: { votes: number };
}

interface VotingCardProps {
  voting: VotingData;
  currentUserId?: string;
  isTrainer?: boolean;
  onVote?: (optionId: string) => void;
  onEdit?: (voting: VotingData) => void;
  onDelete?: (votingId: string) => void;
  onFinalize?: (votingId: string) => void;
  onCancel?: (votingId: string) => void;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function VotingCard({
  voting,
  currentUserId,
  isTrainer = false,
  onVote,
  onEdit,
  onDelete,
  onFinalize,
  onCancel,
  expanded: controlledExpanded,
  onExpandChange,
}: VotingCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const isExpanded = controlledExpanded ?? internalExpanded;
  const setIsExpanded = onExpandChange ?? setInternalExpanded;

  // Получаем всех уникальных пользователей, проголосовавших
  const allVoters = voting.options.flatMap(opt => 
    (opt.votes || []).map(v => ({
      id: v.user.id,
      firstName: v.user.firstName,
      lastName: v.user.lastName,
      photoUrl: v.user.photoUrl,
    }))
  );
  
  // Убираем дубликаты
  const uniqueVoters = allVoters.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  
  const totalVotes = voting._count?.votes || voting.options.reduce((sum, opt) => sum + (opt._count?.votes || 0), 0);
  const isSuccessful = totalVotes >= voting.minParticipants;
  const progressPercent = Math.min((totalVotes / voting.minParticipants) * 100, 100);
  
  // Проверяем, голосовал ли текущий пользователь
  const hasVoted = voting.options.some(opt => 
    (opt.votes || []).some(v => v.user.id === currentUserId)
  );
  
  // Получаем варианты, за которые проголосовал пользователь
  const votedOptions = voting.options.filter(opt => 
    (opt.votes || []).some(v => v.user.id === currentUserId)
  );

  const getTimeLeft = () => {
    const deadline = new Date(voting.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) {
      if (voting.status === "FINALIZED") return "Итоги подведены";
      if (voting.status === "CANCELLED") return "Отменено";
      return "Голосование закрыто";
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  const getStatusBadge = () => {
    switch (voting.status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 text-white border-0">Активно</Badge>;
      case "FINALIZED":
        return <Badge className="bg-blue-500 text-white border-0">Завершено</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500 text-white border-0">Отменено</Badge>;
      case "CLOSED":
        return <Badge className="bg-gray-500 text-white border-0">Закрыто</Badge>;
      default:
        return null;
    }
  };

  const handleVote = async (optionId: string) => {
    if (!onVote || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(optionId);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className={cn(
          "border-0 shadow-lg overflow-hidden transition-shadow",
          isExpanded && "shadow-xl ring-2 ring-purple-200"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{voting.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-white/80 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    До {new Date(voting.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                  {voting.group && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {voting.group.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <button
                  onClick={() => setShowDetails(true)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Микро-аватары и статистика */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {uniqueVoters.length > 0 ? (
                  <>
                    <AvatarStack 
                      users={uniqueVoters} 
                      max={4} 
                      size="xs" 
                    />
                    <span className="text-sm text-white/80">
                      {uniqueVoters.length} {uniqueVoters.length === 1 ? "человек" : uniqueVoters.length < 5 ? "человека" : "человек"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-white/60">Пока никто не голосовал</span>
                )}
              </div>
              <Badge className="bg-white/20 text-white border-0">
                {getTimeLeft()}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Минимум участников</span>
                <span className={cn(
                  "font-bold",
                  isSuccessful ? "text-green-600" : "text-orange-600"
                )}>
                  {totalVotes}/{voting.minParticipants}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isSuccessful 
                      ? "bg-gradient-to-r from-green-400 to-green-500" 
                      : "bg-gradient-to-r from-orange-400 to-orange-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isSuccessful 
                  ? "✅ Занятие состоится!" 
                  : `Нужно еще ${voting.minParticipants - totalVotes} ${voting.minParticipants - totalVotes === 1 ? "человек" : "человека"}`
                }
              </p>
            </div>

            {/* Разворачиваемый контент */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    {/* Варианты голосования */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {hasVoted ? "Вы проголосовали за:" : "Выберите вариант:"}
                      </p>
                      
                      {voting.options.map((option) => {
                        const optionVotes = option.votes || [];
                        const isSelected = votedOptions.some(vo => vo.id === option.id);
                        const voters = optionVotes.map(v => ({
                          id: v.user.id,
                          firstName: v.user.firstName,
                          lastName: v.user.lastName,
                          photoUrl: v.user.photoUrl,
                        }));

                        return (
                          <motion.button
                            key={option.id}
                            onClick={() => !hasVoted && setSelectedOption(option.id)}
                            disabled={hasVoted || voting.status !== "ACTIVE"}
                            className={cn(
                              "w-full p-3 rounded-xl border-2 text-left transition-all",
                              isSelected || selectedOption === option.id
                                ? "border-purple-500 bg-purple-50"
                                : hasVoted
                                ? "border-gray-100 bg-gray-50 opacity-60"
                                : "border-gray-100 hover:border-purple-200 bg-white"
                            )}
                            whileTap={!hasVoted && voting.status === "ACTIVE" ? { scale: 0.98 } : undefined}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  isSelected || selectedOption === option.id
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-gray-300"
                                )}>
                                  {(isSelected || selectedOption === option.id) && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {weekDays[option.dayOfWeek]}, {option.time}
                                  </span>
                                  {option.description && (
                                    <p className="text-xs text-gray-500">{option.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {voters.length > 0 && (
                                  <AvatarStack users={voters} max={3} size="xs" />
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {option._count?.votes || optionVotes.length}
                                </Badge>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Кнопка голосования */}
                    {!hasVoted && voting.status === "ACTIVE" && (
                      <Button
                        onClick={() => selectedOption && handleVote(selectedOption)}
                        disabled={!selectedOption || isVoting}
                        className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white h-12 rounded-xl font-semibold shadow-lg disabled:opacity-50"
                      >
                        {isVoting ? "Голосование..." : "Проголосовать"}
                      </Button>
                    )}

                    {hasVoted && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Вы проголосовали</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {isSuccessful 
                            ? "Занятие состоится. Ссылка на оплату придет после закрытия голосования."
                            : "Ожидаем набора минимального количества участников."
                          }
                        </p>
                      </div>
                    )}

                    {/* Действия тренера */}
                    {isTrainer && voting.status === "ACTIVE" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit?.(voting)}
                          className="flex-1"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onFinalize?.(voting.id)}
                          className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                          disabled={!isSuccessful}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Завершить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel?.(voting.id)}
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопка развернуть/свернуть */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Свернуть</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Подробнее</span>
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sheet с деталями голосования */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">{voting.title}</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 overflow-y-auto pb-20">
            {/* Статус */}
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-sm text-gray-500">
                Создано {new Date(voting.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>

            {/* Информация о голосовании */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Дедлайн</p>
                    <p className="text-sm text-gray-500">
                      {new Date(voting.deadline).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Минимум участников</p>
                    <p className="text-sm text-gray-500">{voting.minParticipants} человек</p>
                  </div>
                </div>

                {voting.chargeOnVote && (
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Списание с баланса</p>
                      <p className="text-sm text-gray-500">При голосовании списывается 1 занятие</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Список всех проголосовавших */}
            <div>
              <h4 className="font-semibold mb-3">Проголосовавшие ({uniqueVoters.length})</h4>
              
              {uniqueVoters.length > 0 ? (
                <div className="space-y-2">
                  {uniqueVoters.map((voter) => (
                    <div 
                      key={voter.id} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <UserAvatar
                        src={voter.photoUrl}
                        firstName={voter.firstName}
                        lastName={voter.lastName}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {voter.firstName} {voter.lastName || ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {voting.options
                            .filter(opt => (opt.votes || []).some(v => v.user.id === voter.id))
                            .map(opt => `${weekDays[opt.dayOfWeek]}, ${opt.time}`)
                            .join("; ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Пока никто не проголосовал</p>
              )}
            </div>

            {/* Telegram сообщение */}
            {voting.telegramPollId && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-800">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Опубликовано в Telegram (ID: {voting.telegramPollId})
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
