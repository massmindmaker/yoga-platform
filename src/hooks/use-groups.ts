"use client";

import { useState, useEffect, useCallback } from "react";

interface Schedule {
  id: string;
  dayOfWeek: number;
  time: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  groupType: "REGULAR" | "INTENSIVE";
  pricingType: "FIXED" | "DYNAMIC";
  fixedPrice: number;
  maxStudents: number;
  telegramChat: string | null;
  trainerId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  schedules: Schedule[];
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
      const response = await fetch("/api/groups");
      const data = await response.json();

      if (data.success) {
        setGroups(data.data);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети");
      console.error("Error fetching groups:", err);
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
    maxStudents?: number;
    telegramChat?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    schedules?: { dayOfWeek: number; time: string }[];
  }) => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchGroups();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error creating group:", err);
      return { success: false, error: "Ошибка сети" };
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
      const response = await fetch(`/api/groups/${id}`);
      const data = await response.json();

      if (data.success) {
        setGroup(data.data);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети");
      console.error("Error fetching group:", err);
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
      const response = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();

      if (data.success) {
        setGroup(data.data);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error updating group:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  const deleteGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      return { success: false, error: "Ошибка сети" };
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return { group, isLoading, error, updateGroup, deleteGroup, refetch: fetchGroup };
}
