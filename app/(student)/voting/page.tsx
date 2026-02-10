"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { VotingCard } from "@/components/voting/voting-card-new";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotings } from "@/src/hooks/use-votings";
import { useUser } from "@/src/hooks/use-user-context";
import { useState } from "react";

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

export default function VotingPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id || "";
  const { votings, isLoading, error, vote, refetch } = useVotings({ userId });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleVote = async (votingId: string, optionId: string) => {
    const result = await vote(votingId, [optionId]);
    if (result.success) {
      toast.success("Голос принят!");
    } else if (result.code === "INSUFFICIENT_BALANCE") {
      toast.error("Недостаточно средств", {
        description: `На балансе: ${result.details?.currentBalance}, нужно: ${result.details?.required}`,
      });
    } else {
      toast.error(result.error || "Ошибка голосования");
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <div className="flex items-center justify-center min-h-[50vh]">
           <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
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
             className="mt-4 bg-gray-900 hover:bg-black"
          >
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const activeVotings = votings.filter((v) => v.status === "ACTIVE");

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
              voting={voting}
              currentUserId={userId}
              isTrainer={false}
              onVote={(optionId) => handleVote(voting.id, optionId)}
              expanded={expandedId === voting.id}
              onExpandChange={(expanded) =>
                setExpandedId(expanded ? voting.id : null)
              }
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
