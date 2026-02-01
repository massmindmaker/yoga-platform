"use client";

import { useState, useEffect, useCallback } from "react";

interface Voting {
  id: string;
  title: string;
  type: string;
  minParticipants: number;
  deadline: string;
  status: string;
  options: VotingOption[];
  _count: {
    votes: number;
  };
}

interface VotingOption {
  id: string;
  dayOfWeek: number;
  time: string;
  votes: number;
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
        setError(data.error || "Failed to fetch votings");
      }
    } catch (err) {
      setError("Network error");
      console.error("Error fetching votings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const vote = async (votingId: string, optionId: string, userId: string) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, userId }),
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
      return { success: false, error: "Network error" };
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [fetchVotings]);

  return { votings, isLoading, error, vote, refetch: fetchVotings };
}
