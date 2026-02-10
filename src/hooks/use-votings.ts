"use client";

import { useState, useEffect, useCallback } from "react";

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
  cancelled: boolean;
  _count: { votes: number };
  votes: Array<{
    id: string;
    userId: string;
    balanceCharged: boolean;
    user: VoteUser;
  }>;
}

export interface Voting {
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
  hasVoted: boolean;
  group: {
    id: string;
    name: string;
    pricingType: "FIXED" | "DYNAMIC";
    fixedPrice?: number;
  };
  options: VotingOption[];
  _count: { votes: number };
}

interface UseVotingsOptions {
  userId?: string;
  groupId?: string;
  status?: string;
}

export function useVotings({ userId, groupId, status }: UseVotingsOptions = {}) {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (groupId) params.set("groupId", groupId);
      if (status) params.set("status", status);

      const response = await fetch(`/api/votings?${params.toString()}`);
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
  }, [userId, groupId, status]);

  const vote = async (votingId: string, optionIds: string[]) => {
    if (!userId) return { success: false, error: "Пользователь не авторизован" };

    try {
      const response = await fetch(`/api/votings/${votingId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds, userId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error, code: data.code, details: data.details };
      }
    } catch (err) {
      console.error("Error voting:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const cancelVote = async (votingId: string, optionIds?: string[]) => {
    if (!userId) return { success: false, error: "Пользователь не авторизован" };

    try {
      const response = await fetch(`/api/votings/${votingId}/vote`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, optionIds }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error cancelling vote:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const finalize = async (votingId: string, prices?: Array<{ optionId: string; price: number }>) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices ? { prices } : {}),
      });

      const data = await response.json();

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error finalizing:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const cancel = async (votingId: string) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error cancelling:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const remind = async (votingId: string) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/remind`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error sending reminder:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const publishToChat = async (votingId: string) => {
    try {
      const response = await fetch(`/api/votings/${votingId}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        await fetchVotings();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error publishing to chat:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [fetchVotings]);

  return {
    votings,
    isLoading,
    error,
    vote,
    cancelVote,
    finalize,
    cancel,
    remind,
    publishToChat,
    refetch: fetchVotings,
  };
}
