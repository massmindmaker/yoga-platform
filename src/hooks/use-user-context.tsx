"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTelegram } from "./use-telegram";

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  role: string;
  balance: number;
}

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
        // Для разработки - используем тестового пользователя
        console.log("No Telegram data, using dev mode");
        setUser({
          id: "test-user-id",
          telegramId: "123456789",
          firstName: "Тестовый",
          lastName: "Пользователь",
          role: "STUDENT",
          balance: 5,
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
      // Для разработки
      setUser({
        id: "test-user-id",
        telegramId: "123456789",
        firstName: "Тестовый",
        lastName: "Пользователь",
        role: "STUDENT",
        balance: 5,
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
