# AGENTS.md — Инструкции для агентов

## Обзор проекта

Yoga Platform — Telegram Mini App для управления йога-студией. Next.js 16 (App Router), React 18, TypeScript (strict), Prisma 6 (PostgreSQL/Neon), Telegram Bot API, оплата через T-Bank. Две роли: ученики (запись на занятия, голосования, покупка пакетов) и тренеры (управление группами, голосованиями, учениками, платежами). Приложение работает внутри Telegram WebApp.

## Команды сборки / линтинга / запуска

```bash
npm install              # Установка зависимостей (postinstall запускает prisma generate)
npm run dev              # Dev-сервер (next dev)
npm run build            # Продакшен-сборка (prisma generate && next build)
npm run lint             # Проверка ESLint (стандартные правила next lint)
npm run lint:fix         # Автоисправление ESLint
npm run seed             # Заполнение БД (tsx prisma/seed.ts)
npx prisma migrate dev   # Миграции БД
npx prisma generate      # Перегенерация Prisma-клиента после изменения схемы
```

Тестовый фреймворк **не настроен**. При добавлении тестов использовать **vitest** (совместим с tsx/TypeScript). Запуск одиночного теста: `npx vitest run path/to/file.test.ts`.

## Стиль кода и форматирование

- **ESLint-конфиг отсутствует** — только стандартные правила `next lint`.
- **Prettier не настроен** — следовать существующему стилю кода.
- **Отступы**: 2 пробела. Табы запрещены.
- **Кавычки**: двойные в `.ts`/`.tsx` файлах (импорты, `"use client"`, JSX-атрибуты).
- **Точки с запятой**: обязательны.
- **Завершающие запятые**: да, в многострочных объектах/массивах/параметрах.
- **Длина строк**: жёстко не ограничена, но ~100–120 символов.
- **Язык**: идентификаторы в коде — на английском. Комментарии и пользовательские строки — на русском.

## Соглашения TypeScript

- **Strict mode** включён (`strict: true` в tsconfig).
- **Path alias**: `@/*` указывает на корень проекта. Всегда `@/lib/...`, `@/components/...`, `@/src/...` — никогда относительных путей между директориями.
- Предпочитать `interface` для описания объектов. `type` — для union, intersection и простых алиасов.
- Enum-значения — string literal union, не TS enum: `type VotingStatus = "ACTIVE" | "FINALIZED" | "CLOSED"`.
- Prisma-перечисления — UPPER_SNAKE_CASE, совпадают со схемой.
- Использовать `Record<string, unknown>` для динамических фильтров (не `any`).

## Порядок импортов

```ts
// 1. Framework / Next.js
import { NextRequest, NextResponse } from "next/server";
// 2. Сторонние библиотеки
import { z } from "zod";
// 3. Внутренние утилиты (@/lib/...)
import { prisma } from "@/lib/db";
import { createVotingSchema } from "@/lib/validation";
// 4. Компоненты (@/components/...)
import { BottomNav } from "@/components/layout/bottom-nav";
// 5. Хуки (@/src/hooks/...)
import { useVotings } from "@/src/hooks/use-votings";
// 6. Типы (@/src/types/...)
import type { Voting } from "@/src/types";
```

## Паттерн API-роутов (app/api/)

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/resource — описание на русском
export async function GET(req: NextRequest) {
  try {
    // 1. Парсинг параметров: searchParams для GET, req.json() для POST/PUT
    // 2. Валидация через Zod (schema.safeParse) для мутаций
    // 3. Операция с БД через prisma
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[RESOURCE_METHOD]", error);
    return NextResponse.json(
      { success: false, error: "Человекочитаемое сообщение об ошибке" },
      { status: 500 }
    );
  }
}
```

**Правила:**
- Каждый ответ имеет форму `{ success: boolean, data?: T, error?: string }`.
- Ошибки валидации: `{ success: false, error: "...", details: issues }` со статусом 400.
- Формат лог-тегов: `[RESOURCE_METHOD]`, например `[VOTINGS_GET]`, `[GROUPS_POST]`.
- Prisma-транзакции (`prisma.$transaction`) для многошаговых мутаций (пример: `app/api/bookings/route.ts`).
- Схемы валидации — в `lib/validation.ts` (Zod v4). Экспортировать и схему, и выведенный тип.
- Динамические параметры роутов: `{ params }: { params: Promise<{ id: string }> }` (Next.js 15+ async params).

## Валидация Zod (lib/validation.ts)

- Именование схем: `createXxxSchema`, `updateXxxSchema`, `xxxQuerySchema`.
- Экспорт типов: `export type CreateXxxInput = z.infer<typeof createXxxSchema>`.
- UUID: `z.string().uuid("сообщение об ошибке")`.
- Время: regex `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`.

## React-компоненты

- Клиентские компоненты начинаются с `"use client";` на первой строке.
- Именованные экспорты: `export function ComponentName()`. Страницы — `export default function`.
- Стилизация: Tailwind CSS. Условные классы через `cn()` из `@/lib/utils`.
- Анимации: Framer Motion (`motion.div`), варианты из `@/lib/animations.ts`. Уважать reduced-motion.
- Иконки: только `lucide-react`. Импортировать поимённо: `import { Home, Calendar } from "lucide-react"`.
- UI-примитивы: shadcn/ui (стиль new-york) в `components/ui/` — **не редактировать**.
- Тосты: `sonner` через `<Toaster />` в корневом layout.
- Хаптик: `import { haptics } from "@/lib/haptics"` — вызывать `haptics.light()` при навигации.

## Хуки (src/hooks/)

- Именование файлов: `use-xxx.ts` (kebab-case). Файлы с JSX (провайдеры) — `.tsx`.
- Хуки для загрузки данных используют локальную `fetchWithRetry<T>()` — 3 попытки, задержка 1с, без повтора на 4xx.
- Возвращают `{ data, isLoading, error, ...actions }`.
- Состояние: `useState<T[]>([])` для списков, `useState<string | null>(null)` для ошибок.
- Fetch-коллбэки оборачивать в `useCallback` с корректными зависимостями.

## База данных (Prisma)

- Схема: `prisma/schema.prisma`. PostgreSQL на Neon Serverless (22 модели).
- Синглтон клиента: `import { prisma } from "@/lib/db"` — никогда не создавать PrismaClient напрямую.
- Имена таблиц: `@@map("snake_case_plural")`, например `@@map("votings")`.
- Индексы `@@index` — обязательны для FK и часто запрашиваемых полей.
- Перечисления — UPPER_SNAKE_CASE. Поля моделей — camelCase.
- `onDelete: Cascade` для «владеемых» связей, `onDelete: Restrict` для критических (trainer, user на payment).

## Структура файлов

```
app/                         # Next.js App Router
  (student)/                 # Страницы ученика (route group)
  (trainer)/                 # Страницы тренера (route group)
  api/                       # API-роуты (~30 файлов route.ts)
  globals.css                # Глобальные стили + CSS-переменные
  layout.tsx                 # Корневой layout (TelegramProvider, Toaster)
components/
  ui/                        # shadcn/ui примитивы (не редактировать)
  layout/                    # Каркас приложения (bottom-nav, page-header, page-container)
  providers/                 # Контекст-провайдеры (telegram-provider)
  voting/, schedule/, ...    # Компоненты по фичам
lib/                         # Серверные утилиты (db, auth, telegram, tbank, validation, animations)
src/
  hooks/                     # Клиентские React-хуки (11 файлов)
  types/                     # TypeScript-типы (index.ts, ~480 строк)
prisma/                      # Схема, миграции, seed
middleware.ts                # Rate limiting (100 req/min), security headers, исключения для вебхуков
```

## Переменные окружения (нет .env.example)

- `DATABASE_URL` — строка подключения PostgreSQL (Neon)
- `TELEGRAM_BOT_TOKEN` — токен Telegram-бота
- `TBANK_TERMINAL_KEY` — ключ терминала T-Bank
- `TBANK_PASSWORD` — пароль T-Bank
- `NEXT_PUBLIC_APP_URL` — публичный URL приложения (для вебхуков, кнопок в Telegram)

## Частые ошибки — избегать

- Не использовать `any` — использовать `unknown` с type guards.
- Не импортировать типы из `@prisma/client` напрямую — использовать `src/types/index.ts` или выводить из Zod.
- Не создавать новые экземпляры PrismaClient — всегда `@/lib/db`.
- Не пропускать Zod-валидацию в POST/PUT/DELETE эндпоинтах.
- Не забывать `"use client"` для компонентов с хуками, состоянием или браузерными API.
- Не добавлять `setInterval`/`setTimeout` на уровне модуля в серверлесс-коде — не переживёт перезапуск.
- Не редактировать файлы в `components/ui/` — это примитивы shadcn/ui.
