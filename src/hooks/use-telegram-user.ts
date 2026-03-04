"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/components/providers/telegram-provider";
import { fetchWithRetry } from "@/lib/fetch";

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
  const telegram = useTelegram();

  useEffect(() => {
    async function authenticate() {
      try {
        const initData = telegram.initData || "";

        if (!initData) {
          // Dev mode — fetch trainer from DB
          const data = await fetchWithRetry<{ success: boolean; data?: Array<{ id: string; firstName: string; lastName?: string; role?: string }> }>(
            "/api/users?role=TRAINER&limit=1"
          );
          
          if (data.success && data.data && data.data.length > 0) {
            const trainer = data.data[0];
            setUser({
              id: trainer.id,
              firstName: trainer.firstName,
              lastName: trainer.lastName || undefined,
              role: (trainer.role as TelegramUser["role"]) || "TRAINER",
            });
          } else {
            // Fallback if no trainer in DB
            setUser({
              id: "dev-trainer",
              firstName: "Тренер",
              role: "TRAINER",
            });
          }
          setIsLoading(false);
          return;
        }

        // Real Telegram auth
        const data = await fetchWithRetry<{ success: boolean; data?: { user: { id: string; firstName: string; lastName?: string; role: string } } }>(
          "/api/auth/telegram",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
          },
          3
        );

        if (data.success && data.data) {
          setUser({
            id: data.data.user.id,
            firstName: data.data.user.firstName,
            lastName: data.data.user.lastName || undefined,
            role: data.data.user.role as TelegramUser["role"],
          });
        }
      } catch (err) {
        console.error("Auth error:", err);
        // Fallback for dev
        setUser({
          id: "dev-trainer",
          firstName: "Тренер",
          role: "TRAINER",
        });
      } finally {
        setIsLoading(false);
      }
    }

    authenticate();
  }, [telegram.initData]);

  return { user, isLoading };
}
