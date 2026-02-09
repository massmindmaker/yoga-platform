"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTelegram } from "./use-telegram";
import type { User, ApiResponse } from "../types";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const telegram = useTelegram();

  const authenticate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получаем initData из Telegram WebApp
      const initData = telegram.initData || "";

      if (!initData) {
        // Для разработки - используем реального студента из базы
        console.log("No Telegram data, using dev mode with real student");
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
        setIsLoading(false);
        return;
      }

      // Отправляем на сервер для авторизации
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Failed to authenticate");
      // Для разработки - используем реального студента
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
  };

  useEffect(() => {
    authenticate();
  }, [telegram.initData]);

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
