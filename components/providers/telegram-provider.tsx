"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { setInitData as setGlobalInitData } from "@/lib/fetch";

// Типы TelegramWebApp и TelegramWebAppUser определены глобально в types/telegram.d.ts

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramWebAppUser | null;
  initData: string;
  isReady: boolean;
  isInTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  initData: "",
  isReady: false,
  isInTelegram: false,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tg = window.Telegram?.WebApp;
      
      if (tg) {
        setWebApp(tg);
        setUser(tg.initDataUnsafe?.user || null);
        const rawInitData = tg.initData || "";
        setInitData(rawInitData);
        // Устанавливаем initData для lib/fetch.ts (auth-заголовок во всех запросах)
        setGlobalInitData(rawInitData);
        setIsInTelegram(true);
        
        // Set header and background colors to match app
        tg.setHeaderColor("#111827");
        tg.setBackgroundColor("#FFFFFF");
        
        // Notify Telegram that the app is ready
        tg.ready();
        setIsReady(true);
      } else {
        setIsInTelegram(false);
        setIsReady(true);
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({ webApp, user, initData, isReady, isInTelegram }),
    [webApp, user, initData, isReady, isInTelegram],
  );

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within TelegramProvider");
  }
  return context;
}
