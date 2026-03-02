"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithRetry } from "@/lib/fetch";

interface Schedule {
  id: string;
  dayOfWeek: number;
  time: string;
}

interface GroupStudent {
  id: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
    balance: number;
    telegramId: string | null;
  };
}

interface GroupVoting {
  id: string;
  title: string;
  type: "SCHEDULE" | "CONFIRM" | "SURVEY";
  status: "ACTIVE" | "FINALIZED" | "CLOSED" | "CANCELLED";
  deadline: string;
  minParticipants: number;
  chargeOnVote: boolean;
  multipleChoice: boolean;
  createdAt: string;
  telegramPollId?: string | null;
  options: Array<{
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
      user: {
        id: string;
        firstName: string;
        lastName: string | null;
      };
    }>;
  }>;
  _count: { votes: number };
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  groupType: "REGULAR" | "INTENSIVE";
  pricingType: "FIXED" | "DYNAMIC";
  fixedPrice: number;
  maxStudents: number;
  telegramChat: string | null;
  telegramChatId: string | null;
  trainerId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  schedules: Schedule[];
  students?: GroupStudent[];
  votings?: GroupVoting[];
  _count: {
    students: number;
    votings?: number;
  };
}



export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchWithRetry<{ success: boolean; data?: Group[]; error?: string }>(
        "/api/groups",
        undefined,
        3
      );

      if (data.success) {
        setGroups(data.data || []);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети после 3 попыток");
      console.error("Error fetching groups after retries:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    groupType?: "REGULAR" | "INTENSIVE";
    pricingType?: "FIXED" | "DYNAMIC";
    fixedPrice?: number;
    intensivePrice?: number;
    maxStudents?: number;
    telegramChat?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    schedules?: { dayOfWeek: number; time: string }[];
  }) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; data?: Group; error?: string }>(
        "/api/groups",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        },
        3
      );

      if (data.success) {
        await fetchGroups();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error creating group after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, isLoading, error, createGroup, refetch: fetchGroups };
}

export function useGroup(id: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchWithRetry<{ success: boolean; data?: Group; error?: string }>(
        `/api/groups/${id}`,
        undefined,
        3
      );

      if (data.success) {
        setGroup(data.data || null);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети после 3 попыток");
      console.error("Error fetching group after retries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateGroup = async (groupData: {
    name?: string;
    description?: string;
    groupType?: "REGULAR" | "INTENSIVE";
    pricingType?: "FIXED" | "DYNAMIC";
    fixedPrice?: number;
    maxStudents?: number;
    telegramChat?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    schedules?: { dayOfWeek: number; time: string }[];
  }) => {
    try {
      const data = await fetchWithRetry<{ success: boolean; data?: Group; error?: string }>(
        `/api/groups/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        },
        3
      );

      if (data.success) {
        setGroup(data.data || null);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error updating group after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  const deleteGroup = async () => {
    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string }>(
        `/api/groups/${id}`,
        { method: "DELETE" },
        3
      );

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error deleting group after retries:", err);
      return { success: false, error: "Ошибка сети после 3 попыток" };
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return { group, isLoading, error, updateGroup, deleteGroup, refetch: fetchGroup };
}
