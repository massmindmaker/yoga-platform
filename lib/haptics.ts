// Telegram WebApp HapticFeedback API
// https://core.telegram.org/bots/webapps#hapticfeedback
// Типы определены глобально в types/telegram.d.ts

function getHapticFeedback(): TelegramWebAppHapticFeedback | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp?.HapticFeedback ?? null;
}

export const haptics = {
  /** Лёгкая вибрация при навигации, переключении табов */
  light: () => {
    getHapticFeedback()?.impactOccurred("light");
  },
  /** Средняя вибрация при действиях (нажатие кнопки, выбор) */
  medium: () => {
    getHapticFeedback()?.impactOccurred("medium");
  },
  /** Вибрация успеха (оплата прошла, бронирование подтверждено) */
  success: () => {
    getHapticFeedback()?.notificationOccurred("success");
  },
  /** Вибрация ошибки */
  error: () => {
    getHapticFeedback()?.notificationOccurred("error");
  },
  /** Вибрация предупреждения */
  warning: () => {
    getHapticFeedback()?.notificationOccurred("warning");
  },
  /** Лёгкая вибрация при изменении выбора (свайп, скролл) */
  selectionChanged: () => {
    getHapticFeedback()?.selectionChanged();
  },
};
