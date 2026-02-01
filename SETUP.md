# Yoga Platform - Инструкция по настройке

## 🚀 Быстрый старт

### 1. Telegram Бот

1. Открой Telegram и найди @BotFather
2. Отправь команду `/newbot`
3. Придумай название бота (например: "Yoga Studio Bot")
4. Придумай username бота (например: `yoga_studio_bot`)
5. Скопируй токен (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Добавь его в `.env`:
   ```
   TELEGRAM_BOT_TOKEN="ваш_токен"
   ```

### 2. T-Bank (Тинькофф) - Оплата

1. Зарегистрируйся в [Tinkoff Business](https://business.tinkoff.ru/)
2. Получи доступ к приему платежей
3. Создай терминал в личном кабинете
4. Скопируй:
   - **Terminal Key** - добавь в `TBANK_TERMINAL_KEY`
   - **Пароль** - добавь в `TBANK_PASSWORD`

### 3. Настройка Webhook

После деплоя установи webhook для бота:

```bash
# Локально
curl "https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://yoga-platform-qjlvcfu2h-massmindmakers-projects.vercel.app/api/telegram/webhook"

# Или открой в браузере:
# https://yoga-platform-qjlvcfu2h-massmindmakers-projects.vercel.app/api/telegram/webhook
```

### 4. Переменные окружения в Vercel

Добавь в Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:... (уже добавлено)
TELEGRAM_BOT_TOKEN=ваш_токен
TBANK_TERMINAL_KEY=ваш_ключ
TBANK_PASSWORD=ваш_пароль
NEXT_PUBLIC_APP_URL=https://yoga-platform-qjlvcfu2h-massmindmakers-projects.vercel.app
```

## 📱 Интеграции

### Telegram WebApp

Пользователь открывает приложение через бота:
1. Бот отправляет кнопку "Открыть приложение"
2. Пользователь нажимает
3. Приложение получает `initData` с telegramId и username
4. Пользователь автоматически авторизуется

### T-Bank Оплата

1. Пользователь выбирает количество занятий
2. Нажимает "Оплатить"
3. Создается платеж в T-Bank
4. Пользователь перенаправляется на страницу оплаты
5. После успешной оплаты:
   - T-Bank отправляет webhook
   - Баланс пользователя пополняется
   - Отправляется уведомление в Telegram

## 🔌 API Endpoints

### Авторизация
```
POST /api/auth/telegram
Body: { initData: string }
```

### Голосования
```
GET  /api/votings
POST /api/votings
POST /api/votings/[id]/vote
```

### Платежи
```
GET  /api/payments?userId=xxx
POST /api/payments
POST /api/payments/webhook (от T-Bank)
```

### Пользователи
```
GET  /api/users
POST /api/users
GET  /api/users/[id]
PATCH /api/users/[id]
```

## 📊 Структура БД

```
users (id, telegramId, firstName, lastName, role, balance)
  ↓
bookings → classes
  ↓
payments
  ↓
votes → votings → voting_options
  ↓
group_students → groups → schedules
```

## 🎯 Готово к использованию!

После настройки всех переменных:
1. Пользователь заходит в бота
2. Нажимает "Открыть приложение"
3. Видит свой баланс и расписание
4. Может купить занятия через T-Bank
5. Получает уведомления о голосованиях
