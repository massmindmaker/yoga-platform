"use client";

import { useState, useEffect, useCallback } from "react";

interface VotingOption {
  id: string;
  dayOfWeek: number;
  time: string;
  _count: {
    votes: number;
  };
}

interface Voting {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  minVotes: number;
  status: "active" | "completed" | "cancelled";
  options: VotingOption[];
  _count: {
    votes: number;
  };
  hasVoted?: boolean;
}

export function useVotings() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/votings");
      const data = await response.json();

      if (data.success) {
        setVotings(data.data);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети");
      console.error("Error fetching votings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const vote = async (votingId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Обновляем список голосований
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error voting:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [fetchVotings]);

  return { votings, isLoading, error, vote, refetch: fetchVotings };
}
