import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Конфигурация rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 100; // максимум запросов за окно

// Хранилище для rate limiting (в production использовать Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Получить IP адрес
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

// Rate limiting
function rateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();

  // Очистка устаревших записей (inline, без setInterval для edge runtime)
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const record = rateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
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
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - record.count,
    resetTime: record.resetTime,
  };
}

// Security headers
const securityHeaders: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Добавляем security headers ко всем ответам
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Полностью исключаем webhook endpoints из всех проверок
  if (
    request.nextUrl.pathname === "/api/payments/webhook" ||
    request.nextUrl.pathname === "/api/telegram/webhook"
  ) {
    return response;
  }

  // Rate limiting для API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = getClientIP(request);
    const limit = rateLimit(identifier);

    // Добавляем rate limit headers
    response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
    response.headers.set("X-RateLimit-Remaining", limit.remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(limit.resetTime / 1000).toString()
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            "Retry-After": Math.ceil(
              (limit.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // CSRF protection отключена для API routes - используем Telegram auth
    // Запросы из Telegram WebApp могут иметь разные origin headers
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
