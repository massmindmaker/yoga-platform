"use client";

import { useEffect, useState } from "react";

interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: "STUDENT" | "TRAINER" | "ADMIN";
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, return a mock trainer user
    // In production, this would get data from Telegram WebApp initData
    const mockUser: TelegramUser = {
      id: "trainer-001",
      firstName: "Ирина",
      lastName: "Петрова",
      username: "trainer_irina",
      role: "TRAINER",
    };
    
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}
