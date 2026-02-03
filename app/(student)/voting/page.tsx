"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { VotingCard } from "@/components/voting/voting-card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotings } from "@/src/hooks/use-votings";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const DAYS_OF_WEEK = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export default function VotingPage() {
  const { votings, isLoading, error, vote, refetch } = useVotings();

  const handleVote = async (votingId: string, optionId: string) => {
    const result = await vote(votingId, optionId);
    if (!result.success) {
      toast.error(result.error || "Ошибка голосования");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={refetch} 
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  // Transform API data to VotingCard format
  const activeVotings = votings
    .filter((v) => v.status === "ACTIVE")
    .map((v) => ({
      id: v.id,
      title: v.title,
      deadline: v.deadline,
      minParticipants: v.minVotes,
      currentVotes: v._count.votes,
      hasVoted: v.hasVoted || false,
      options: v.options.map((o) => ({
        id: o.id,
        day: DAYS_OF_WEEK[o.dayOfWeek],
        time: o.time,
        votes: o._count.votes,
      })),
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Голосования" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {activeVotings.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <p className="text-gray-500">Нет активных голосований</p>
          </motion.div>
        )}

        {activeVotings.map((voting) => (
          <motion.div key={voting.id} variants={itemVariants}>
            <VotingCard
              {...voting}
              onVote={(optionId) => handleVote(voting.id, optionId)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
