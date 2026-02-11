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

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Max retries exceeded');
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

      const data = await fetchWithRetry<{ success: boolean; data?: Voting[]; error?: string }>(
        `/api/votings?${params.toString()}`,
        undefined,
        3
      );

      if (data.success) {
        setVotings(data.data || []);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети после 3 попыток");
      console.error("Error fetching votings after retries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, groupId, status]);

  const vote = async (votingId: string, optionIds: string[]) => {
    if (!userId) return { success: false, error: "Пользователь не авторизован" };

    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string; code?: string; details?: unknown }>(
        `/api/votings/${votingId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionIds, userId }),
        },
        3
      );

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error, code: data.code, details: data.details };
      }
    } catch (err) {
      console.error("Error voting after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const cancelVote = async (votingId: string, optionIds?: string[]) => {
    if (!userId) return { success: false, error: "Пользователь не авторизован" };

    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string }>(
        `/api/votings/${votingId}/vote`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, optionIds }),
        },
        3
      );

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error cancelling vote after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const finalize = async (votingId: string, prices?: Array<{ optionId: string; price: number }>) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string }>(
        `/api/votings/${votingId}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prices ? { prices } : {}),
        },
        3
      );

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error finalizing after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const cancel = async (votingId: string) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string }>(
        `/api/votings/${votingId}/cancel`,
        { method: "POST" },
        3
      );

      if (data.success) {
        await fetchVotings();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error cancelling after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const remind = async (votingId: string) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; data?: unknown; error?: string }>(
        `/api/votings/${votingId}/remind`,
        { method: "POST" },
        3
      );

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error sending reminder after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const publishToChat = async (votingId: string) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; data?: unknown; error?: string }>(
        `/api/votings/${votingId}/publish`,
        { method: "POST" },
        3
      );

      if (data.success) {
        await fetchVotings();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error publishing to chat after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
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
