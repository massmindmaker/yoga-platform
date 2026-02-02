"use client";

import { PageHeader } from "@/components/layout/page-header";
import { VotingCard } from "@/components/voting/voting-card";
import { useState } from "react";
import { motion } from "framer-motion";

const activeVotings = [
  {
    id: "1",
    title: "Йога в пятницу",
    deadline: "2026-02-06T18:00:00",
    minParticipants: 10,
    currentVotes: 8,
    hasVoted: false,
    options: [
      { id: "1", day: "Пятница", time: "07:30", votes: 5 },
      { id: "2", day: "Пятница", time: "19:00", votes: 3 },
    ],
  },
  {
    id: "2",
    title: "Онлайн на неделю",
    deadline: "2026-02-02T22:00:00",
    minParticipants: 5,
    currentVotes: 12,
    hasVoted: true,
    options: [
      { id: "1", day: "Понедельник", time: "07:30", votes: 8 },
      { id: "2", day: "Вторник", time: "10:00", votes: 5 },
      { id: "3", day: "Среда", time: "07:30", votes: 12 },
    ],
  },
];

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
  const [votings] = useState(activeVotings);

  const handleVote = (votingId: string, optionId: string) => {
    console.log("Vote:", votingId, optionId);
    // TODO: API call
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Голосования" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {votings.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              🗳️
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Нет активных голосований
            </h3>
            <p className="text-gray-500">Новые голосования появятся здесь</p>
          </motion.div>
        ) : (
          votings.map((voting) => (
            <motion.div key={voting.id} variants={itemVariants}>
              <VotingCard
                {...voting}
                onVote={(optionId) => handleVote(voting.id, optionId)}
              />
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
