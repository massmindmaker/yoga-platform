'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, TelegramWebAppUser } from '../types';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  user: User | null;
  initData: string;
  isReady: boolean;
  isInTelegram: boolean;
  theme: 'light' | 'dark';
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  hapticFeedback: {
    impact: (style: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
}

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.Telegram?.WebApp) {
      setIsReady(true);
      return;
    }
    
    const tg = window.Telegram.WebApp;
    setWebApp(tg);

      // Initialize WebApp
      tg.ready();
      tg.expand();

      // Extract user data
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        setUser({
          id: tgUser.id.toString(),
          telegramId: tgUser.id.toString(),
          firstName: tgUser.first_name,
          lastName: tgUser.last_name ?? null,
          username: tgUser.username,
          photoUrl: tgUser.photo_url,
          role: 'STUDENT', // Default role
          balance: 0,
          phone: null,
          email: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      setIsReady(true);
  }, []);

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  const showBackButton = useCallback((onClick: () => void) => {
    if (webApp) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  }, [webApp]);

  const hideBackButton = useCallback(() => {
    if (webApp) {
      webApp.BackButton.hide();
    }
  }, [webApp]);

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy') => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      webApp?.HapticFeedback.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged();
    },
  };

  return {
    webApp,
    user,
    initData: webApp?.initData || '',
    isReady,
    isInTelegram: !!webApp,
    theme: webApp?.colorScheme || 'light',
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
  };
}
