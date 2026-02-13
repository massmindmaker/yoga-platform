"use client";

import { UserProvider, useUser } from "@/src/hooks/use-user-context";
import StudentMainPage from "@/app/(student)/page";
import StudentLayout from "@/app/(student)/layout";
import TrainerDashboard from "@/app/(trainer)/dashboard/page";
import TrainerLayout from "@/app/(trainer)/layout";
import { Loader2 } from "lucide-react";

// Router based on authenticated user role
function RoleRouter() {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Требуется авторизация
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="https://t.me/Yom23_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-[#3BCEAC] text-white rounded-xl font-medium hover:bg-[#14B8A6] transition-colors"
          >
            Открыть в Telegram
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Пользователь не найден
          </h1>
          <p className="text-gray-600">
            Откройте приложение через Telegram бота @Yom23_bot
          </p>
        </div>
      </div>
    );
  }

  // Route based on user role
  if (user.role === "TRAINER") {
    return (
      <TrainerLayout>
        <TrainerDashboard />
      </TrainerLayout>
    );
  }

  // Default to student view
  return (
    <StudentLayout>
      <StudentMainPage />
    </StudentLayout>
  );
}

// Main authenticated router with UserProvider
export function AuthenticatedRouter() {
  return (
    <UserProvider>
      <RoleRouter />
    </UserProvider>
  );
}
