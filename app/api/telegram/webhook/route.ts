import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage, sendMainMenu, notifyGroupAboutClass } from "@/lib/bot-messages";
import { createTelegramInvoice, sendPaymentRequestAfterVote } from "@/lib/telegram";

function getAppUrl(path: string = ""): string {
  return ((process.env.NEXT_PUBLIC_APP_URL || "").trim() + path);
}

// Обработка команды /start
async function handleStart(chatId: number, user: any, isGroup: boolean) {
  try {
    console.log("[WEBHOOK] handleStart called:", { chatId, userId: user?.id, isGroup });
    
    if (isGroup) {
      await sendTelegramMessage(
        chatId,
        `👋 Привет, группа!

Я бот Yoga Studio. Я буду присылать сюда:
• Напоминания о занятиях
• Новости о голосованиях
• Статистику группы

Используйте команды:
/groupschedule - расписание
/stats - статистика`
      );
      return;
    }

    // Личное сообщение
    console.log("[WEBHOOK] Upserting user:", { telegramId: user.id.toString(), firstName: user.first_name });

    // Получаем или создаем пользователя
    const dbUser = await prisma.user.upsert({
      where: { telegramId: user.id.toString() },
      update: { firstName: user.first_name },
      create: {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name || null,
        role: "STUDENT",
        balance: 0,
      },
    });

    console.log("[WEBHOOK] User upserted:", { id: dbUser.id, balance: dbUser.balance });

    const appUrl = getAppUrl();
    console.log("[WEBHOOK] App URL for web_app:", JSON.stringify(appUrl));

    await sendTelegramMessage(
      chatId,
      `👋 Привет, ${user.first_name}!

Твой баланс: *${dbUser.balance}* занятий

Я помогу тебе:
• Записываться на занятия
• Узнавать о голосованиях
• Отслеживать баланс`,
      appUrl ? {
        inline_keyboard: [
          [
            {
              text: "🧘‍♀️ Открыть приложение",
              web_app: { url: appUrl },
            },
          ],
          [
            { text: "💰 Мой баланс", callback_data: "show_balance" },
            { text: "📅 Расписание", callback_data: "show_schedule" },
          ],
        ],
      } : {
        inline_keyboard: [
          [
            { text: "💰 Мой баланс", callback_data: "show_balance" },
            { text: "📅 Расписание", callback_data: "show_schedule" },
          ],
        ],
      }
    );
    
    console.log("[WEBHOOK] handleStart completed successfully for chatId:", chatId);
  } catch (error) {
    console.error("[WEBHOOK] Error in handleStart:", error);
    // Try to send a basic error message to the user
    try {
      await sendTelegramMessage(chatId, "❌ Произошла ошибка. Попробуйте позже или обратитесь к тренеру.");
    } catch (sendError) {
      console.error("[WEBHOOK] Failed to send error message:", sendError);
    }
  }
}

// Обработка команды /help
async function handleHelp(chatId: number, isGroup: boolean) {
  if (isGroup) {
    await sendTelegramMessage(
      chatId,
      `📋 Команды бота в группе:

/groupschedule - расписание занятий
/stats - статистика группы

Бот автоматически присылает уведомления о новых занятиях и напоминания.`
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `📋 Доступные команды:

/balance - проверить баланс
/schedule - расписание занятий
/vote - активные голосования
/help - эта справка

Также можно открыть приложение кнопкой ниже.`,
      {
        inline_keyboard: [
          [
            {
              text: "🧘‍♀️ Открыть приложение",
              web_app: { url: getAppUrl() },
            },
          ],
        ],
      }
    );
  }
}

// Обработка команды /balance
async function handleBalance(chatId: number, user: any) {
  const dbUser = await prisma.user.findFirst({
    where: { telegramId: user.id.toString() },
  });

  if (!dbUser) {
    await sendTelegramMessage(
      chatId,
      "❌ Сначала отправьте /start для регистрации"
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `💰 Ваш баланс: *${dbUser.balance}* занятий

${dbUser.balance === 0 ? "⚠️ Баланс пуст! Пополните в приложении." : "✅ Можно записываться на занятия!"}`,
    {
      inline_keyboard: [
        [
          {
            text: "💳 Пополнить",
            web_app: {
              url: getAppUrl("/purchase"),
            },
          },
        ],
      ],
    }
  );
}

// Обработка команды /schedule
async function handleSchedule(chatId: number, isGroup: boolean) {
  const groups = await prisma.group.findMany({
    include: { schedules: true },
  });

  if (groups.length === 0) {
    await sendTelegramMessage(chatId, "📅 Пока нет доступных групп");
    return;
  }

  let message = isGroup ? "📅 Расписание групп:\n\n" : "📅 Доступные группы:\n\n";

  for (const group of groups) {
    const days = group.schedules.map((s) => getDayName(s.dayOfWeek)).join(", ");
    message += `*${group.name}*\n`;
    message += `📍 ${days}\n`;
    message += `👥 Мест: ${group.maxStudents}\n\n`;
  }

  message += "Записаться можно в приложении:";

  await sendTelegramMessage(
    chatId,
    message,
    {
      inline_keyboard: [
        [
          {
            text: "🧘‍♀️ Записаться",
            web_app: { url: getAppUrl() },
          },
        ],
      ],
    }
  );
}

// Обработка команды /vote
async function handleVote(chatId: number, user: any) {
  const activeVotings = await prisma.voting.findMany({
    where: { status: "ACTIVE" },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });

  if (activeVotings.length === 0) {
    await sendTelegramMessage(chatId, "🗳️ Сейчас нет активных голосований");
    return;
  }

  for (const voting of activeVotings) {
    const totalVotes = voting.options.reduce(
      (sum, opt) => sum + opt._count.votes,
      0
    );
    const minVotes = voting.minParticipants;
    const progress = Math.round((totalVotes / minVotes) * 100);

    await sendTelegramMessage(
      chatId,
      `🗳️ *${voting.title}*\n\n` +
        `📊 Проголосовало: *${totalVotes}/${minVotes}* (${progress}%)\n` +
        `⏰ До: ${voting.deadline.toLocaleDateString("ru-RU")}\n\n` +
        `${progress >= 100 ? "✅ Занятие состоится!" : `⚠️ Нужно еще ${Math.max(0, minVotes - totalVotes)} голосов`}`,
      {
        inline_keyboard: [
          [
            {
              text: "🗳️ Проголосовать",
              web_app: {
                url: getAppUrl("/voting"),
              },
            },
          ],
        ],
      }
    );
  }
}

// Обработка callback queries
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = callbackQuery.from;
  
  // Обработка голосования
  if (data.startsWith("vote_")) {
    const parts = data.split("_");
    const votingId = parts[1];
    const optionId = parts[2];
    
    await handleVoteFromCallback(callbackQuery, votingId, optionId);
    return;
  }
  
  // Обработка запроса на оплату
  if (data.startsWith("pay_voting_")) {
    const parts = data.split("_");
    const votingId = parts[2];
    const userId = parts[3];
    
    await handlePaymentRequest(callbackQuery, votingId, userId);
    return;
  }

  if (data === "show_balance") {
    await handleBalance(chatId, user);
  } else if (data === "show_schedule") {
    await handleSchedule(chatId, false);
  }

  // Отвечаем на callback чтобы убрать "часики"
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQuery.id }),
    }
  );
}

// Обработка голосования из callback
async function handleVoteFromCallback(callbackQuery: any, votingId: string, optionId: string) {
  const chatId = callbackQuery.message.chat.id;
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    // Находим пользователя
    const user = await prisma.user.findFirst({
      where: { telegramId: telegramUserId }
    });
    
    if (!user) {
      await sendTelegramMessage(
        chatId,
        "❌ Вы не зарегистрированы. Отправьте /start для регистрации."
      );
      await answerCallback(callbackQuery.id);
      return;
    }
    
    // Проверяем, не голосовал ли уже
    const existingVote = await prisma.vote.findFirst({
      where: { votingId, userId: user.id }
    });
    
    if (existingVote) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Вы уже проголосовали в этом голосовании."
      );
      await answerCallback(callbackQuery.id);
      return;
    }
    
    // Находим голосование
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { 
        group: true,
        options: true
      }
    });
    
    if (!voting || voting.status !== "ACTIVE") {
      await sendTelegramMessage(
        chatId,
        "❌ Голосование не найдено или уже завершено."
      );
      await answerCallback(callbackQuery.id);
      return;
    }
    
    // Создаем голос
    await prisma.vote.create({
      data: {
        votingId,
        optionId,
        userId: user.id
      }
    });
    
    // Находим выбранную опцию
    const option = voting.options.find(o => o.id === optionId);
    const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    
    // Отправляем подтверждение голосования
    await sendTelegramMessage(
      chatId,
      `✅ Вы проголосовали!\n\n📅 ${DAYS_SHORT[option?.dayOfWeek || 0]} ${option?.time}\n🗳️ ${voting.title}`,
      {
        inline_keyboard: [
          [{
            text: "🗳️ Посмотреть результаты",
            web_app: { url: getAppUrl("/voting") }
          }]
        ]
      }
    );
    
    // Если нужна оплата - отправляем запрос на оплату
    if (voting.chargeOnVote) {
      const price = voting.group?.fixedPrice || 1000;
      
      // Проверяем баланс
      if (user.balance < 1) {
        // Создаем invoice для оплаты
        await createTelegramInvoice(chatId.toString(), {
          title: `Оплата голосования: ${voting.title}`,
          description: `Оплата 1 занятия для участия в голосовании`,
          payload: `voting_${votingId}_${user.id}`,
          amount: price * 100, // в копейках
          currency: "RUB"
        });
      } else {
        // У пользователя есть баланс - списываем автоматически
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { balance: { decrement: 1 } }
          });
          
          await tx.balanceTransaction.create({
            data: {
              userId: user.id,
              amount: -1,
              type: "VOTE_DEDUCTION",
              description: `Списание за голосование: ${voting.title}`
            }
          });
        });
        
        await sendTelegramMessage(
          chatId,
          `💰 С вашего баланса списано 1 занятие.\nОсталось занятий: ${user.balance - 1}`
        );
      }
    }
    
    await answerCallback(callbackQuery.id, "✅ Голос принят!");
    
  } catch (error) {
    console.error("Error processing vote:", error);
    await sendTelegramMessage(
      chatId,
      "❌ Произошла ошибка при обработке голоса."
    );
    await answerCallback(callbackQuery.id);
  }
}

// Обработка запроса на оплату
async function handlePaymentRequest(callbackQuery: any, votingId: string, userId: string) {
  const chatId = callbackQuery.message.chat.id;
  
  try {
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { group: true }
    });
    
    if (!voting) {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено");
      return;
    }
    
    const price = voting.group?.fixedPrice || 1000;
    
    // Создаем invoice
    await createTelegramInvoice(chatId.toString(), {
      title: `Оплата: ${voting.title}`,
      description: `Оплата 1 занятия для участия в голосовании`,
      payload: `voting_${votingId}_${userId}`,
      amount: price * 100,
      currency: "RUB"
    });
    
    await answerCallback(callbackQuery.id, "💳 Открываю оплату...");
    
  } catch (error) {
    console.error("Error creating invoice:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка создания счета");
  }
}

// Вспомогательная функция для ответа на callback
async function answerCallback(callbackQueryId: string, text?: string) {
  const body: any = { callback_query_id: callbackQueryId };
  if (text) body.text = text;
  if (text) body.show_alert = true;
  
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

// Бота добавили в группу
async function handleBotAddedToGroup(chatId: number) {
  await sendTelegramMessage(
    chatId,
    `👋 Привет, группа!

Я бот Yoga Studio. Я буду присылать сюда:
• 📅 Расписание занятий
• 🗳️ Голосования
• ⏰ Напоминания

Доступные команды:
/groupschedule - расписание
/stats - статистика

Настройте эту группу в приложении, привязав к группе йоги.`
  );
}

// Новый участник добавлен в группу
async function handleNewChatMember(chatId: number, member: any) {
  try {
    // Находим группу по chatId — ищем и по telegramChat (ссылка/username) и по telegramChatId (числовой ID)
    const group = await prisma.group.findFirst({
      where: {
        OR: [
          { telegramChat: chatId.toString() },
          { telegramChatId: chatId.toString() },
        ],
      },
    });

    if (!group) {
      console.log(`[WEBHOOK] Group not found for chat ${chatId}`);
      return;
    }

    // Создаем или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: member.id.toString() },
      update: {
        firstName: member.first_name,
        lastName: member.last_name || null,
        username: member.username || null,
      },
      create: {
        telegramId: member.id.toString(),
        firstName: member.first_name,
        lastName: member.last_name || null,
        username: member.username || null,
        role: "STUDENT",
        balance: 0,
      },
    });

    // Добавляем в группу
    await prisma.groupStudent.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        userId: user.id,
      },
    });

    console.log(`[WEBHOOK] Added user ${user.id} to group ${group.id}`);
  } catch (error) {
    console.error("[WEBHOOK] Error handling new chat member:", error);
  }
}

// Расписание для группы
async function handleGroupSchedule(chatId: number) {
  // Находим группу по chatId (ищем по обоим полям)
  const group = await prisma.group.findFirst({
    where: {
      OR: [
        { telegramChat: chatId.toString() },
        { telegramChatId: chatId.toString() },
      ],
    },
  });

  if (!group) {
    await sendTelegramMessage(
      chatId,
      "❌ Эта группа не привязана к группе йоги.\n\nАдминистратор может привязать группу в приложении."
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `📅 *${group.name}*\n\n` +
      `👥 Мест: ${group.maxStudents}\n\n` +
      `Подробное расписание доступно в приложении.`
  );
}

// Статистика группы
async function handleGroupStats(chatId: number) {
  const group = await prisma.group.findFirst({
    where: {
      OR: [
        { telegramChat: chatId.toString() },
        { telegramChatId: chatId.toString() },
      ],
    },
    include: { _count: { select: { students: true } } },
  });

  if (!group) {
    await sendTelegramMessage(
      chatId,
      "❌ Эта группа не привязана к группе йоги."
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `📊 *${group.name}*\n\n` +
      `👥 Учеников: ${group._count.students}/${group.maxStudents}\n` +
      `✅ Доступно мест: ${group.maxStudents - group._count.students}`
  );
}

// Вспомогательные функции
function getDayName(dayOfWeek: number): string {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[dayOfWeek];
}

async function getBotInfo() {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
  );
  const data = await response.json();
  return data.result;
}

// Обработка pre-checkout query (проверка перед оплатой)
async function handlePreCheckoutQuery(preCheckoutQuery: any) {
  const payload = preCheckoutQuery.invoice_payload;
  
  // Проверяем, что голосование и пользователь существуют
  if (payload.startsWith("voting_")) {
    const parts = payload.split("_");
    const votingId = parts[1];
    const userId = parts[2];
    
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { group: true }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (voting && user) {
      // Подтверждаем оплату
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_checkout_query_id: preCheckoutQuery.id,
            ok: true
          }),
        }
      );
      return;
    }
  }
  
  // Отклоняем оплату
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pre_checkout_query_id: preCheckoutQuery.id,
        ok: false,
        error_message: "Ошибка: голосование или пользователь не найдены"
      }),
    }
  );
}

// Обработка успешного платежа
async function handleSuccessfulPayment(message: any) {
  const chatId = message.chat.id;
  const payment = message.successful_payment;
  const payload = payment.invoice_payload;
  const telegramUserId = message.from.id.toString();
  
  if (payload.startsWith("voting_")) {
    const parts = payload.split("_");
    const votingId = parts[1];
    const userId = parts[2];
    
    try {
      // Находим пользователя
      const user = await prisma.user.findFirst({
        where: { telegramId: telegramUserId }
      });
      
      if (!user) {
        await sendTelegramMessage(chatId, "❌ Ошибка: пользователь не найден");
        return;
      }
      
      // Находим голосование
      const voting = await prisma.voting.findUnique({
        where: { id: votingId },
        include: { group: true }
      });
      
      if (!voting) {
        await sendTelegramMessage(chatId, "❌ Ошибка: голосование не найдено");
        return;
      }
      
      // Создаем запись о платеже
      await prisma.$transaction(async (tx) => {
        // Создаем платеж
        await tx.payment.create({
          data: {
            userId: user.id,
            amount: payment.total_amount / 100,
            status: "COMPLETED",
            provider: "telegram_stars",
            classesCount: 1,
          }
        });
        
        // Увеличиваем баланс пользователя
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: 1 } }
        });
        
        // Создаем запись о транзакции баланса
        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            amount: 1,
            type: "PAYMENT_CREDIT",
            description: `Оплата через Telegram за голосование: ${voting.title}`
          }
        });
      });
      
      // Отправляем подтверждение
      await sendTelegramMessage(
        chatId,
        `✅ *Оплата успешна!*\n\n💰 Сумма: ${payment.total_amount / 100} ${payment.currency}\n🎫 Ваш баланс пополнен на 1 занятие\n\nТеперь вы участвуете в голосовании "${voting.title}"`,
        {
          inline_keyboard: [
            [{
              text: "🗳️ Перейти к голосованию",
              web_app: { url: getAppUrl("/voting") }
            }]
          ]
        }
      );
      
    } catch (error) {
      console.error("Error processing payment:", error);
      await sendTelegramMessage(
        chatId,
        "❌ Произошла ошибка при обработке платежа. Пожалуйста, обратитесь в поддержку."
      );
    }
  }
}

// POST /api/telegram/webhook - webhook для сообщений от бота
export async function POST(req: NextRequest) {
  try {
    // Webhook secret validation disabled for now
    // const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    // const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    // if (webhookSecret && headerSecret && headerSecret !== webhookSecret) {
    //   console.error("[WEBHOOK] Invalid secret token");
    //   return NextResponse.json({ ok: false }, { status: 403 });
    // }

    const update = await req.json();
    console.log("[WEBHOOK] Update received:", JSON.stringify(update).slice(0, 500));

    // Обработка pre-checkout query (проверка перед оплатой)
    if (update.pre_checkout_query) {
      await handlePreCheckoutQuery(update.pre_checkout_query);
      return NextResponse.json({ ok: true });
    }

    // Обработка успешного платежа
    if (update.message?.successful_payment) {
      await handleSuccessfulPayment(update.message);
      return NextResponse.json({ ok: true });
    }

    // Обработка callback queries (кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Обработка сообщений
    if (update.message) {
      const chatId = update.message.chat.id;
      const from = update.message.from;
      const text = update.message.text || "";
      const isGroup = update.message.chat.type === "group" || update.message.chat.type === "supergroup";

      // Команда /start
      if (text === "/start") {
        await handleStart(chatId, from, isGroup);
      }
      // Команда /help
      else if (text === "/help") {
        await handleHelp(chatId, isGroup);
      }
      // Команда /balance
      else if (text === "/balance") {
        await handleBalance(chatId, from);
      }
      // Команда /schedule
      else if (text === "/schedule") {
        await handleSchedule(chatId, isGroup);
      }
      // Команда /vote
      else if (text === "/vote") {
        await handleVote(chatId, from);
      }
      // Команда для группы - показать расписание группы
      else if (isGroup && text === "/groupschedule") {
        await handleGroupSchedule(chatId);
      }
      // Команда для группы - статистика
      else if (isGroup && text === "/stats") {
        await handleGroupStats(chatId);
      }
      // Если в группу добавили участников (включая бота)
      else if (update.message.new_chat_members) {
        const botId = (await getBotInfo()).id;
        const isBotAdded = update.message.new_chat_members.some(
          (member: any) => member.id === botId
        );
        if (isBotAdded) {
          await handleBotAddedToGroup(chatId);
        }
        
        // Обрабатываем добавление обычных пользователей
        for (const member of update.message.new_chat_members) {
          if (!member.is_bot && member.id !== botId) {
            await handleNewChatMember(chatId, member);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WEBHOOK] Error in Telegram webhook:", error);
    return NextResponse.json({ ok: false, error: "Internal webhook error" });
  }
}

// GET /api/telegram/webhook - установка webhook
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = getAppUrl("/api/telegram/webhook");

  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not set" },
      { status: 500 }
    );
  }

  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const body: Record<string, string> = { url: webhookUrl };
    if (webhookSecret) {
      body.secret_token = webhookSecret;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      { error: "Failed to set webhook" },
      { status: 500 }
    );
  }
}
