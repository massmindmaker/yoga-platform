"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { VotingCard } from "@/components/voting/voting-card-new";
import { motion } from "framer-motion";
import { Loader2, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { useVotings } from "@/src/hooks/use-votings";
import { useUser } from "@/src/hooks/use-user-context";
import { fetchWithRetry } from "@/lib/fetch";
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
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id || "";
  const { votings, isLoading, error, vote, refetch } = useVotings({ userId });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePayCard = (votingId: string) => {
    // Navigate to purchase page for card payment
    router.push("/purchase");
  };

  const handlePayBalance = async (votingId: string) => {
    if (!user?.id) return;

    const balance = user.balance || 0;
    if (balance < 1) {
      toast.error("Недостаточно занятий на балансе");
      router.push("/purchase");
      return;
    }

    // Deduct 1 class from balance
    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string; code?: string }>("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          votingId,
          type: "BALANCE_DEDUCT",
        }),
      }, 1);
      if (data.success) {
        toast.success("Занятие списано с баланса");
        refetch();
      } else {
        toast.error(data.error || "Ошибка списания");
        if (data.code === "INSUFFICIENT_BALANCE") {
          router.push("/purchase");
        }
      }
    } catch {
      toast.error("Ошибка списания с баланса");
    }
  };

  const handleVote = async (votingId: string, optionId: string) => {
    const result = await vote(votingId, [optionId]);
    if (result.success) {
      toast.success("Голос принят!");
    } else if (result.code === "INSUFFICIENT_BALANCE") {
      const details = result.details as { currentBalance?: number; required?: number } | undefined;
      toast.error("Недостаточно средств", {
        description: details ? `На балансе: ${details.currentBalance}, нужно: ${details.required}` : undefined,
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
           <Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Голосования" />
        <ErrorFallback error={error} onRetry={refetch} />
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
          <EmptyState
            icon={Vote}
            title="Нет активных голосований"
            description="Голосования появятся когда тренер их создаст"
          />
        )}

        {activeVotings.map((voting) => (
          <motion.div key={voting.id} variants={itemVariants}>
            <VotingCard
              voting={voting}
              currentUserId={userId}
              isTrainer={false}
              onVote={(optionId) => handleVote(voting.id, optionId)}
              onPayCard={handlePayCard}
              onPayBalance={handlePayBalance}
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
