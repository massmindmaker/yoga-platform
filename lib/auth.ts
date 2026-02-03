// Authentication utilities
import { NextRequest, NextResponse } from "next/server";
import { validateTelegramData } from "./telegram";

// Конфигурация rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 100; // максимум запросов за окно

// Хранилище для rate limiting (в production использовать Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Rate limiting middleware
export function rateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
    // Новое окно
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    // Лимит превышен
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Увеличиваем счетчик
  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - record.count,
    resetTime: record.resetTime,
  };
}

// Получить IP адрес из запроса
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

// Middleware для проверки авторизации через Telegram
export function requireAuth(
  handler: (req: NextRequest, user: { id: string; telegramId: string; role: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Получаем initData из заголовка или тела
      const initData = req.headers.get("x-telegram-init-data");
      
      if (!initData) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }

      // Валидируем данные от Telegram
      const telegramUser = validateTelegramData(initData);

      if (!telegramUser) {
        return NextResponse.json(
          { success: false, error: "Invalid authentication" },
          { status: 401 }
        );
      }

      // Здесь можно добавить проверку пользователя в БД
      // Для примера возвращаем базовые данные
      const user = {
        id: telegramUser.id.toString(),
        telegramId: telegramUser.id.toString(),
        role: "STUDENT", // или получать из БД
      };

      return handler(req, user);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

// Middleware для rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: { identifier?: (req: NextRequest) => string }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = options?.identifier?.(req) || getClientIP(req);
    const limit = rateLimit(identifier);

    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(limit.resetTime / 1000).toString(),
            "Retry-After": Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const response = await handler(req);
    
    // Добавляем заголовки rate limit к ответу
    response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
    response.headers.set("X-RateLimit-Remaining", limit.remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(limit.resetTime / 1000).toString());
    
    return response;
  };
}

// Комбинированный middleware: auth + rate limit
export function withAuthAndRateLimit(
  handler: (req: NextRequest, user: { id: string; telegramId: string; role: string }) => Promise<NextResponse>
) {
  return withRateLimit(requireAuth(handler));
}

// Проверка CSRF токена
export function validateCSRF(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "https://web.telegram.org",
  ].filter(Boolean);

  // Разрешаем запросы без origin (мобильные приложения)
  if (!origin) return true;

  return allowedOrigins.some((allowed) => origin.startsWith(allowed || ""));
}
