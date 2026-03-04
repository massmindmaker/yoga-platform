"use client";

/**
 * Клиентская утилита для HTTP-запросов с retry-логикой и Telegram-авторизацией.
 *
 * - 3 попытки с задержкой 1с
 * - НЕ повторяет 4xx (клиентские ошибки не исправятся сами)
 * - Автоматически прикрепляет x-telegram-init-data заголовок
 */

// Ссылка на initData устанавливается TelegramProvider при инициализации
let _initData: string = "";
// Telegram user ID — не протухает, используется для простой авторизации
let _telegramUserId: string = "";

/**
 * Установить initData для всех последующих запросов.
 * Вызывается один раз из TelegramProvider.
 */
export function setInitData(initData: string) {
  _initData = initData;
}

/**
 * Установить Telegram user ID для авторизации.
 * Вызывается из TelegramProvider — не зависит от expiry initData.
 */
export function setTelegramUserId(userId: string) {
  _telegramUserId = userId;
}

/**
 * Получить текущий initData (для случаев когда нужен напрямую).
 */
export function getInitData(): string {
  return _initData;
}

/**
 * Fetch с retry-логикой и автоматической Telegram-авторизацией.
 *
 * @param url - URL запроса
 * @param options - стандартные RequestInit опции
 * @param retries - количество попыток (по умолчанию 3)
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = 3,
): Promise<T> {
  // Добавляем auth-заголовки к каждому запросу
  const headers = new Headers(options?.headers);
  if (_initData) {
    headers.set("x-telegram-init-data", _initData);
  }
  if (_telegramUserId) {
    headers.set("x-telegram-user-id", _telegramUserId);
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        // Не повторяем клиентские ошибки (4xx) — они не исправятся сами
        if (response.status >= 400 && response.status < 500) {
          const data = await response.json().catch(() => ({}));
          throw Object.assign(new Error(`HTTP ${response.status}`), {
            status: response.status,
            data,
          });
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (e: unknown) {
      // Не повторяем 4xx
      if (e instanceof Error && "status" in e) {
        const statusError = e as Error & { status: number };
        if (statusError.status >= 400 && statusError.status < 500) throw e;
      }
      // Последняя попытка — пробрасываем ошибку
      if (i === retries - 1) throw e;
      // Ждём 1с перед повтором
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Max retries exceeded");
}
