"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

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
  onPublishToChat?: (votingId: string) => void;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function VotingCard({
  voting,
  currentUserId,
  isTrainer = false,
  onVote,
  onEdit,
  onFinalize,
  onCancel,
  onPublishToChat,
  expanded: controlledExpanded,
  onExpandChange,
}: VotingCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const isExpanded = controlledExpanded ?? internalExpanded;
  const setIsExpanded = onExpandChange ?? setInternalExpanded;

  const totalVotes = voting._count?.votes || voting.options.reduce((s, o) => s + (o._count?.votes || 0), 0);
  const isActive = voting.status === "ACTIVE";
  const progressPct = voting.minParticipants > 0 ? Math.min((totalVotes / voting.minParticipants) * 100, 100) : 0;
  const isSuccessful = totalVotes >= voting.minParticipants;

  const hasVoted = voting.options.some(opt =>
    (opt.votes || []).some(v => v.user.id === currentUserId)
  );
  const votedOptions = voting.options.filter(opt =>
    (opt.votes || []).some(v => v.user.id === currentUserId)
  );

  const deadlineStr = new Date(voting.deadline).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });

  const handleVote = async (optionId: string) => {
    if (!onVote || isVoting) return;
    setIsVoting(true);
    try { await onVote(optionId); } finally { setIsVoting(false); }
  };

  const handlePublish = async () => {
    if (!onPublishToChat || isPublishing) return;
    setIsPublishing(true);
    try { await onPublishToChat(voting.id); } finally { setIsPublishing(false); }
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all",
      isExpanded && "ring-2 ring-[#3BCEAC]/30 shadow-md"
    )}>
      {/* ===== COMPACT HEADER — always visible ===== */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        {/* Left: mint accent bar */}
        <div className={cn(
          "w-1 self-stretch rounded-full flex-shrink-0",
          isActive ? "bg-[#3BCEAC]" : "bg-gray-300"
        )} />

        {/* Middle: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-[15px] leading-snug truncate">
              {voting.title}
            </h4>
            <Badge className={cn(
              "text-[10px] px-1.5 py-0 border-0 flex-shrink-0",
              isActive ? "bg-[#CCFBF1] text-[#0D9488]" : "bg-gray-100 text-gray-500"
            )}>
              {isActive ? "Активно" : voting.status === "CANCELLED" ? "Отменено" : "Закрыто"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              До {deadlineStr}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalVotes}/{voting.minParticipants}
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isSuccessful ? "bg-[#3BCEAC]" : "bg-gray-300"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Right: chevron */}
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ===== EXPANDED CONTENT ===== */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Trainer action icons */}
              {isTrainer && isActive && (
                <div className="flex items-center gap-1 pt-1 border-t border-gray-50">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(voting)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {onPublishToChat && (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#3BCEAC] transition-colors disabled:opacity-50"
                      title="Отправить в чат"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {onFinalize && (
                    <button
                      onClick={() => onFinalize(voting.id)}
                      disabled={!isSuccessful}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-30"
                      title="Завершить"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {onCancel && (
                    <button
                      onClick={() => onCancel(voting.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                      title="Отменить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Status hints */}
                  <span className="ml-auto text-xs text-gray-400">
                    {isSuccessful ? "✅ Кворум набран" : `Ещё ${voting.minParticipants - totalVotes} ${pluralize(voting.minParticipants - totalVotes, "голос", "голоса", "голосов")}`}
                  </span>
                </div>
              )}

              {/* Voting options */}
              <div className="space-y-1.5">
                {voting.options.map((option) => {
                  const votes = option.votes || [];
                  const voteCount = option._count?.votes || votes.length;
                  const isSelected = votedOptions.some(vo => vo.id === option.id);
                  const isChosen = selectedOption === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (!hasVoted && isActive) setSelectedOption(option.id);
                      }}
                      disabled={hasVoted || !isActive}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        isSelected || isChosen
                          ? "border-[#3BCEAC] bg-[#F0FDF9]"
                          : "border-gray-100 bg-gray-50",
                        !hasVoted && isActive && "hover:border-[#3BCEAC]/50"
                      )}
                    >
                      {/* Radio dot */}
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                        isSelected || isChosen ? "border-[#3BCEAC] bg-[#3BCEAC]" : "border-gray-300"
                      )}>
                        {(isSelected || isChosen) && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                      {/* Day & time */}
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {DAYS[option.dayOfWeek]} {option.time}
                        </span>
                        {option.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                        )}
                      </div>
                      {/* Vote count + voter names */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-medium text-gray-600">{voteCount}</span>
                        {votes.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[100px] truncate">
                            {votes.map(v => v.user.firstName).join(", ")}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Vote button (student) */}
              {!hasVoted && isActive && !isTrainer && (
                <Button
                  onClick={() => selectedOption && handleVote(selectedOption)}
                  disabled={!selectedOption || isVoting}
                  className="w-full bg-[#3BCEAC] hover:bg-[#14B8A6] text-white h-11 rounded-xl font-semibold disabled:opacity-50"
                >
                  {isVoting ? "Голосование..." : "Проголосовать"}
                </Button>
              )}

              {/* Voted confirmation */}
              {hasVoted && (
                <div className="flex items-center gap-2 p-3 bg-[#F0FDF9] rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-[#3BCEAC] flex-shrink-0" />
                  <span className="text-sm text-[#0D9488]">Вы проголосовали</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
