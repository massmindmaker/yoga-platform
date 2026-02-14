"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useTelegram } from "@/components/providers/telegram-provider";
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

/**
 * Map TelegramUser (from initDataUnsafe) to our User type for immediate UI display.
 * This is a temporary user object until server validates and returns the real one.
 */
function telegramUserToUser(tgUser: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string }): User {
  return {
    id: tgUser.id.toString(),
    telegramId: tgUser.id.toString(),
    firstName: tgUser.first_name,
    lastName: tgUser.last_name ?? null,
    username: tgUser.username,
    photoUrl: tgUser.photo_url,
    role: 'STUDENT',
    balance: 0,
    phone: null,
    email: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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

      console.log("[AUTH] Telegram user from context:", telegram.user);
      console.log("[AUTH] isInTelegram:", telegram.isInTelegram);
      console.log("[AUTH] initData present:", !!telegram.initData);

      // If not in Telegram, show as guest
      if (!telegram.isInTelegram) {
        console.log("[AUTH] Not in Telegram, showing as guest");
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Use Telegram user data immediately for UI (from TelegramProvider context)
      // Map TelegramUser → User for correct field names (first_name → firstName)
      if (telegram.user) {
        console.log("[AUTH] Using Telegram user data immediately:", telegram.user.first_name);
        setUser(telegramUserToUser(telegram.user));
      }

      // Validate with server if initData is available
      if (telegram.initData) {
        try {
          console.log("[AUTH] Validating with server...");
          const data = await fetchWithRetry<{ success: boolean; data?: { user: User }; error?: string }>(
            "/api/auth/telegram",
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `tma ${telegram.initData}`
              },
              body: JSON.stringify({ initData: telegram.initData }),
            },
            3
          );

          console.log("[AUTH] Server validation response:", data);

          if (data.success && data.data) {
            console.log("[AUTH] Server returned user:", data.data.user);
            // Update with server user (has proper ID from database)
            setUser(data.data.user);
          } else {
            console.warn("[AUTH] Server validation failed:", data.error);
            // Keep using mapped Telegram user data if server validation fails
          }
        } catch (err) {
          console.error("[AUTH] Server validation error:", err);
          // Keep using mapped Telegram user data if server is unavailable
        }
      } else {
        console.warn("[AUTH] No initData available for server validation");
      }
    } catch (err) {
      console.error("[AUTH] Unexpected error:", err);
      setError("Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  }, [telegram.initData, telegram.user, telegram.isReady, telegram.isInTelegram]);

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
