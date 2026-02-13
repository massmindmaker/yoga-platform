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

      // Wait for Telegram to be ready
      if (!telegram.isReady) {
        console.log("[AUTH] Telegram not ready yet, waiting...");
        return;
      }

      const initData = telegram.initData;
      
      console.log("[AUTH] initData present:", !!initData);
      console.log("[AUTH] initData length:", initData?.length);
      console.log("[AUTH] isInTelegram:", telegram.isInTelegram);

      // If not in Telegram, show demo mode
      if (!telegram.isInTelegram) {
        console.log("[AUTH] Not in Telegram, using demo mode");
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!initData) {
        console.error("[AUTH] No Telegram initData - retrying...");
        // Don't set error immediately, retry after delay
        setTimeout(() => {
          authenticate();
        }, 500);
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

      console.log("[AUTH] Telegram auth response:", data);

      if (data.success && data.data) {
        console.log("[AUTH] User from API:", data.data.user);
        console.log("[AUTH] User photoUrl:", data.data.user.photoUrl);
        setUser(data.data.user);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error after retries:", err);
      setError("Ошибка авторизации. Попробуйте перезапустить приложение через Telegram.");
    } finally {
      setIsLoading(false);
    }
  }, [telegram.initData]);

  useEffect(() => {
    if (telegram.isReady) {
      authenticate();
    }
  }, [telegram.isReady, authenticate]);

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
