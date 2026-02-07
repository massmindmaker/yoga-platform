import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Конфигурация rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 100; // максимум запросов за окно

// Хранилище для rate limiting (в production использовать Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Очистка устаревших записей
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
const securityHeaders = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Добавляем security headers ко всем ответам
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting для API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Исключаем webhook endpoints от rate limiting (они имеют свою проверку)
    if (
      request.nextUrl.pathname === "/api/payments/webhook" ||
      request.nextUrl.pathname === "/api/telegram/webhook"
    ) {
      return response;
    }

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

    // CSRF protection для изменяющих запросов
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        "https://web.telegram.org",
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter(Boolean);

      // Проверяем origin (разрешаем запросы без origin для мобильных)
      if (origin) {
        const isAllowedOrigin = allowedOrigins.some((allowedOrigin) =>
          allowedOrigin ? origin.startsWith(allowedOrigin) : false
        );
        if (!isAllowedOrigin) {
          return NextResponse.json(
            { success: false, error: `Invalid origin: ${origin}` },
            { status: 403 }
          );
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
