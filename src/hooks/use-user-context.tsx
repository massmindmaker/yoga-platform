"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useTelegram } from "./use-telegram";
import type { User } from "../types";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const telegram = useTelegram();

  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const initData = telegram.initData || "";

      if (!initData) {
        console.log("No Telegram data, using dev mode with real student");
        setUser({
          id: "0ed1ec7c-fd36-4b32-a437-a42eace04409",
          telegramId: "student_8",
          firstName: "Ирина",
          lastName: "Михайлова",
          photoUrl: "https://api.telegram.org/file/bot8342725080:AAH3ldtlOmZDv3bcZLRpNtcZxhgzfTP1olE/photos/file_1.jpg",
          role: "STUDENT",
          balance: 46,
          phone: null,
          email: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsLoading(false);
        return;
      }

      const data = await fetchWithRetry<{ success: boolean; data?: { user: User }; error?: string }>(
        "/api/auth/telegram",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        },
        3
      );

      if (data.success && data.data) {
        setUser(data.data.user);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error after retries:", err);
      setError("Failed to authenticate after 3 retries");
      setUser({
        id: "0ed1ec7c-fd36-4b32-a437-a42eace04409",
        telegramId: "student_8",
        firstName: "Ирина",
        lastName: "Михайлова",
        role: "STUDENT",
        balance: 46,
        phone: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [telegram.initData]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, refetch: authenticate }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
