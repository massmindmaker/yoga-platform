"use client";

import { motion } from "framer-motion";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface TelegramMessageProps {
  text: string;
  isBot?: boolean;
  timestamp?: string;
  buttons?: Array<{
    text: string;
    url?: string;
    callback?: string;
  }>;
}

export function TelegramMessage({ 
  text, 
  isBot = true, 
  timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  buttons = []
}: TelegramMessageProps) {
  return (
    <motion.div
      className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className={`max-w-[85%] ${isBot ? "ml-2" : "mr-2"}`}>
        {/* Avatar for bot */}
        {isBot && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center">
              <span className="text-white text-xs font-bold">Y</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">Yoga Studio Bot</span>
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isBot
              ? "bg-white border border-gray-100 rounded-tl-sm"
              : "bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white rounded-tr-sm"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
          
          {/* Timestamp */}
          <div className={`text-right mt-1 ${isBot ? "text-gray-400" : "text-white/70"}`}>
            <span className="text-[10px]">{timestamp}</span>
            {!isBot && <Check className="w-3 h-3 inline ml-1" />}
          </div>
        </div>

        {/* Inline buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {buttons.map((button, index) => (
              <motion.button
                key={index}
                className="bg-white border border-gray-200 text-[#7C3AED] px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => button.url && window.open(button.url, "_blank")}
              >
                {button.text}
                {button.url && <ExternalLink className="w-3 h-3 inline ml-1" />}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TelegramCommandCardProps {
  command: string;
  description: string;
  example?: string;
}

export function TelegramCommandCard({ command, description, example }: TelegramCommandCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
              {command}
            </span>
            <motion.button
              onClick={handleCopy}
              className="text-gray-400 hover:text-[#7C3AED] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>
          </div>
          
          <p className="text-sm text-gray-600 mb-1">{description}</p>
          
          {example && (
            <p className="text-xs text-gray-400 italic">
              Пример: {example}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface TelegramGroupPreviewProps {
  name: string;
  memberCount: number;
  description: string;
  inviteLink: string;
  isActive?: boolean;
}

export function TelegramGroupPreview({
  name,
  memberCount,
  description,
  inviteLink,
  isActive = true,
}: TelegramGroupPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00A8E8] flex items-center justify-center shadow-lg shadow-blue-200">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{name}</h3>
            {isActive && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-sm text-gray-500">{memberCount} участников</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {/* Invite Link */}
      <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">Ссылка для приглашения:</p>
          <p className="text-sm text-gray-700 truncate font-mono">{inviteLink}</p>
        </div>
        
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#6D28D9] transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Копировать</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Bot command list for group creation
export const botCommands = [
  {
    command: "/start",
    description: "Начать работу с ботом и получить приветственное сообщение",
    example: "/start",
  },
  {
    command: "/schedule",
    description: "Посмотреть расписание занятий группы",
    example: "/schedule",
  },
  {
    command: "/book",
    description: "Записаться на занятие",
    example: "/book 123",
  },
  {
    command: "/cancel",
    description: "Отменить запись на занятие",
    example: "/cancel 123",
  },
  {
    command: "/balance",
    description: "Проверить баланс занятий",
    example: "/balance",
  },
  {
    command: "/help",
    description: "Получить справку по командам",
    example: "/help",
  },
];

// Example bot messages
export const exampleMessages = {
  welcome: `👋 Привет! Я бот Yoga Studio.

Я помогу вам:
• Записываться на занятия
• Отслеживать расписание
• Проверять баланс
• Получать уведомления

Нажмите кнопку ниже, чтобы открыть приложение:`,

  classReminder: `⏰ Напоминание о занятии!

🧘‍♀️ Утренняя Хатха-йога
📅 Сегодня в 10:00
📍 Студия А
👤 Тренер: Мария Иванова

До начала осталось 2 часа. Не забудьте воду и коврик! 🙏`,

  bookingConfirmed: `✅ Запись подтверждена!

🧘‍♀️ Вечерняя Виньяса
📅 Завтра в 19:00
📍 Студия Б

С вашего баланса списано 1 занятие.
Осталось занятий: 5`,

  lowBalance: `⚠️ У вас заканчиваются занятия!

Осталось: 1 занятие

Рекомендуем пополнить баланс, чтобы не пропустить любимые занятия.`,
};
