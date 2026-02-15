import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage, sendMainMenu, notifyGroupAboutClass } from "@/lib/bot-messages";
import { createTelegramInvoice } from "@/lib/telegram";

function getAppUrl(path: string = ""): string {
  return ((process.env.NEXT_PUBLIC_APP_URL || "").trim() + path);
}

// Автоматическое сохранение числового chatId группы при любом сообщении
// Это решает проблему приватных инвайт-ссылок (https://t.me/+xxx), которые нельзя резолвить через API
async function autoSaveChatId(chatId: number) {
  try {
    const chatIdStr = chatId.toString();
    
    // Проверяем — уже сохранён?
    const alreadySaved = await prisma.group.findFirst({
      where: { telegramChatId: chatIdStr },
    });
    if (alreadySaved) return; // Уже привязан
    
    // Получаем информацию о чате через Telegram API
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    
    let chatTitle = "";
    let chatInviteLink = "";
    let chatUsername = "";
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      if (data.ok) {
        chatTitle = data.result.title || "";
        chatInviteLink = data.result.invite_link || "";
        chatUsername = data.result.username || "";
      }
    } catch {
      // Не критично — продолжаем с fallback
    }
    
    // Стратегия сопоставления: ищем группу по invite link, username, или если одна группа без chatId
    const groupsWithoutChatId = await prisma.group.findMany({
      where: {
        telegramChatId: null,
        telegramChat: { not: null },
      },
    });
    
    if (groupsWithoutChatId.length === 0) return;
    
    let matchedGroup = null;
    
    for (const group of groupsWithoutChatId) {
      const link = group.telegramChat || "";
      
      // Точное совпадение invite link
      if (chatInviteLink && link === chatInviteLink) {
        matchedGroup = group;
        break;
      }
      
      // Сравниваем хеш-часть приватных ссылок (t.me/+HASH)
      const linkHash = link.match(/t\.me\/\+([a-zA-Z0-9_-]+)/)?.[1];
      const chatHash = chatInviteLink.match(/t\.me\/\+([a-zA-Z0-9_-]+)/)?.[1];
      if (linkHash && chatHash && linkHash === chatHash) {
        matchedGroup = group;
        break;
      }
      
      // Username совпадение: @username или t.me/username
      if (chatUsername) {
        if (link === `@${chatUsername}` || link.includes(`t.me/${chatUsername}`)) {
          matchedGroup = group;
          break;
        }
      }
    }
    
    // Fallback: если только одна группа без chatId — привязываем к ней
    if (!matchedGroup && groupsWithoutChatId.length === 1) {
      matchedGroup = groupsWithoutChatId[0];
      console.log(`[WEBHOOK] Auto-save fallback: only one group without chatId, matching "${matchedGroup.name}"`);
    }
    
    if (!matchedGroup) {
      console.log(`[WEBHOOK] Could not match chat "${chatTitle}" (${chatIdStr}) to any group.`);
      console.log(`[WEBHOOK] Chat invite_link: "${chatInviteLink}", username: "${chatUsername}"`);
      console.log(`[WEBHOOK] Groups without chatId: ${groupsWithoutChatId.map(g => `"${g.name}" (link: ${g.telegramChat})`).join(", ")}`);
      return;
    }
    
    // Сохраняем chatId
    await prisma.group.update({
      where: { id: matchedGroup.id },
      data: { telegramChatId: chatIdStr },
    });
    console.log(`[WEBHOOK] Auto-saved telegramChatId ${chatIdStr} for group "${matchedGroup.name}" (${matchedGroup.id}), chat title: "${chatTitle}"`);
  } catch (error) {
    console.error("[WEBHOOK] Error auto-saving chatId:", error);
  }
}

// Обработка команды /start
async function handleStart(chatId: number, user: any, isGroup: boolean) {
  try {
    console.log("[WEBHOOK] handleStart called:", { chatId, userId: user?.id, isGroup });
    
    if (isGroup) {
      // Сохраняем числовой chatId
      await autoSaveChatId(chatId);
      
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

// Обработка ответа на нативный Telegram Poll
// Голос ВСЕГДА бесплатный — оплата происходит отдельно (кнопка под Poll-ом)
async function handlePollAnswer(pollAnswer: any) {
  const telegramUserId = pollAnswer.user.id.toString();
  const pollId = pollAnswer.poll_id;
  const optionIndices: number[] = pollAnswer.option_ids;

  console.log(`[WEBHOOK] poll_answer: user=${telegramUserId}, poll=${pollId}, options=${JSON.stringify(optionIndices)}`);

  try {
    // Находим голосование по Telegram Poll ID
    const voting = await prisma.voting.findFirst({
      where: { telegramPollId: pollId, status: "ACTIVE" },
      include: {
        options: { orderBy: { id: "asc" } },
      },
    });

    if (!voting) {
      console.log(`[WEBHOOK] poll_answer: voting not found for poll ${pollId}`);
      return;
    }

    // Находим пользователя
    const user = await prisma.user.findFirst({
      where: { telegramId: telegramUserId },
    });

    if (!user) {
      console.log(`[WEBHOOK] poll_answer: user not found for telegramId ${telegramUserId}`);
      return;
    }

    // optionIndices пустой = пользователь отозвал все голоса
    if (optionIndices.length === 0) {
      const votesToCancel = await prisma.vote.findMany({
        where: { votingId: voting.id, userId: user.id, refunded: false },
      });

      if (votesToCancel.length > 0) {
        await prisma.vote.updateMany({
          where: { votingId: voting.id, userId: user.id, refunded: false },
          data: { refunded: true, refundedAt: new Date() },
        });
        console.log(`[WEBHOOK] poll_answer: cancelled ${votesToCancel.length} votes for user ${user.id}`);
      }
      return;
    }

    // Синхронизируем голоса: poll_answer приходит с полным набором выбранных опций
    const selectedOptionIds = optionIndices
      .map((idx) => voting.options[idx]?.id)
      .filter(Boolean) as string[];

    const existingVotes = await prisma.vote.findMany({
      where: { votingId: voting.id, userId: user.id, refunded: false },
      select: { id: true, optionId: true },
    });

    const existingOptionIds = existingVotes.map((v) => v.optionId);
    const toAdd = selectedOptionIds.filter((id) => !existingOptionIds.includes(id));
    const toRemove = existingVotes.filter((v) => !selectedOptionIds.includes(v.optionId));

    await prisma.$transaction(async (tx) => {
      // Отзываем голоса, которых больше нет в выборе
      for (const vote of toRemove) {
        await tx.vote.update({
          where: { id: vote.id },
          data: { refunded: true, refundedAt: new Date() },
        });
      }

      // Добавляем новые голоса (без списания баланса)
      for (const optionId of toAdd) {
        await tx.vote.upsert({
          where: { optionId_userId: { optionId, userId: user.id } },
          update: { refunded: false, refundedAt: null, balanceCharged: false },
          create: {
            votingId: voting.id,
            optionId,
            userId: user.id,
            balanceCharged: false,
          },
        });
      }
    });

    console.log(`[WEBHOOK] poll_answer: user ${user.id} — added ${toAdd.length}, removed ${toRemove.length}`);
  } catch (error) {
    console.error("[WEBHOOK] Error handling poll_answer:", error);
  }
}

// Обработка callback queries
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = callbackQuery.from;
  
  // Новый формат: v:{shortVotingId}:{optionIndex}
  if (data.startsWith("v:")) {
    const parts = data.split(":");
    const shortVotingId = parts[1];
    const optionIndex = parseInt(parts[2], 10);
    
    await handleVoteFromCallback(callbackQuery, shortVotingId, optionIndex);
    return;
  }
  
  // Старый формат (совместимость): vote_{votingId}_{optionId}
  if (data.startsWith("vote_")) {
    const parts = data.split("_");
    await handleVoteFromCallbackLegacy(callbackQuery, parts[1], parts[2]);
    return;
  }
  
  // Обработка запроса на оплату (legacy)
  if (data.startsWith("pay_voting_")) {
    const parts = data.split("_");
    const votingId = parts[2];
    const userId = parts[3];
    
    await handlePaymentRequest(callbackQuery, votingId, userId);
    return;
  }
  
  // FIXED: Оплатить картой — pc:{shortVotingId}
  if (data.startsWith("pc:")) {
    await handleFixedPayCard(callbackQuery, data.split(":")[1]);
    return;
  }
  
  // FIXED: Списать с баланса — pb:{shortVotingId}
  if (data.startsWith("pb:")) {
    await handleFixedPayBalance(callbackQuery, data.split(":")[1]);
    return;
  }
  
  // DYNAMIC: Оплатить картой — pd:{shortVotingId}:{optionIndex}
  if (data.startsWith("pd:")) {
    const parts = data.split(":");
    await handleDynamicPayCard(callbackQuery, parts[1], parseInt(parts[2], 10));
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

// Голосование из Telegram inline-кнопки (новый формат v:shortId:index)
async function handleVoteFromCallback(callbackQuery: any, shortVotingId: string, optionIndex: number) {
  const chatId = callbackQuery.message.chat.id;
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    // Находим пользователя
    const user = await prisma.user.findFirst({
      where: { telegramId: telegramUserId }
    });
    
    if (!user) {
      await answerCallback(callbackQuery.id, "❌ Отправьте /start для регистрации");
      return;
    }
    
    // Находим голосование по короткому ID (first 8 chars)
    const voting = await prisma.voting.findFirst({
      where: { 
        id: { startsWith: shortVotingId },
        status: "ACTIVE"
      },
      include: { 
        group: { select: { pricingType: true, fixedPrice: true } },
        options: { orderBy: { id: "asc" } }
      }
    });
    
    if (!voting) {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено или завершено");
      return;
    }
    
    const option = voting.options[optionIndex];
    if (!option) {
      await answerCallback(callbackQuery.id, "❌ Вариант не найден");
      return;
    }

    // Делегируем реальному API через внутренний вызов — единая логика
    await processVoteFromTelegram(callbackQuery, chatId, user, voting, option);
    
  } catch (error) {
    console.error("[WEBHOOK] Error processing vote:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка обработки голоса");
  }
}

// Старый формат (vote_{uuid}_{uuid}) — совместимость
async function handleVoteFromCallbackLegacy(callbackQuery: any, votingId: string, optionId: string) {
  const chatId = callbackQuery.message.chat.id;
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    const user = await prisma.user.findFirst({ where: { telegramId: telegramUserId } });
    if (!user) {
      await answerCallback(callbackQuery.id, "❌ Отправьте /start для регистрации");
      return;
    }

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { 
        group: { select: { pricingType: true, fixedPrice: true } },
        options: true
      }
    });
    
    if (!voting || voting.status !== "ACTIVE") {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено или завершено");
      return;
    }

    const option = voting.options.find(o => o.id === optionId);
    if (!option) {
      await answerCallback(callbackQuery.id, "❌ Вариант не найден");
      return;
    }

    await processVoteFromTelegram(callbackQuery, chatId, user, voting, option);
  } catch (error) {
    console.error("[WEBHOOK] Error processing legacy vote:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка обработки голоса");
  }
}

// Общая логика голосования из Telegram inline-кнопок (legacy, без списания)
async function processVoteFromTelegram(callbackQuery: any, chatId: number, user: any, voting: any, option: any) {
  const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  
  // Проверяем, не голосовал ли уже за эту опцию (idempotent)
  const existingVote = await prisma.vote.findUnique({
    where: { optionId_userId: { optionId: option.id, userId: user.id } }
  });
  
  if (existingVote && !existingVote.refunded) {
    await answerCallback(callbackQuery.id, "⚠️ Вы уже голосовали за этот вариант");
    return;
  }
  
  // Создаём голос (без списания — оплата отдельно через кнопки)
  await prisma.vote.upsert({
    where: { optionId_userId: { optionId: option.id, userId: user.id } },
    update: { refunded: false, refundedAt: null, balanceCharged: false },
    create: {
      votingId: voting.id,
      optionId: option.id,
      userId: user.id,
      balanceCharged: false,
    },
  });
  
  await answerCallback(callbackQuery.id, `✅ Голос принят: ${DAYS_SHORT[option.dayOfWeek]} ${option.time}`);
}

// FIXED: Оплатить картой — создаёт Telegram Invoice
async function handleFixedPayCard(callbackQuery: any, shortVotingId: string) {
  const chatId = callbackQuery.message.chat.id;
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    const user = await prisma.user.findFirst({ where: { telegramId: telegramUserId } });
    if (!user) {
      await answerCallback(callbackQuery.id, "❌ Отправьте /start для регистрации");
      return;
    }
    
    const voting = await prisma.voting.findFirst({
      where: { id: { startsWith: shortVotingId }, status: { in: ["ACTIVE", "CLOSED"] } },
      include: { group: { select: { fixedPrice: true, name: true } } },
    });
    
    if (!voting) {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено");
      return;
    }
    
    const price = voting.group.fixedPrice || 1;
    // fixedPrice — это количество занятий; для оплаты картой нужна цена в рублях
    // Используем стандартную цену занятия (можно хранить в group или settings)
    // Пока: 1 занятие = fixedPrice * 100 (копейки) — placeholder
    // TODO: определить реальную цену рубля за занятие
    
    await createTelegramInvoice(chatId.toString(), {
      title: `Оплата: ${voting.title}`,
      description: `Оплата ${price} зан. для ${voting.group.name}`,
      payload: `voting_${voting.id}_${user.id}`,
      amount: price * 100 * 100, // цена в копейках (placeholder: 100₽ за занятие)
      currency: "RUB",
    });
    
    await answerCallback(callbackQuery.id, "💳 Открываю оплату...");
  } catch (error) {
    console.error("[WEBHOOK] handleFixedPayCard error:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка создания счёта");
  }
}

// FIXED: Списать с баланса
async function handleFixedPayBalance(callbackQuery: any, shortVotingId: string) {
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    const user = await prisma.user.findFirst({ where: { telegramId: telegramUserId } });
    if (!user) {
      await answerCallback(callbackQuery.id, "❌ Отправьте /start для регистрации");
      return;
    }
    
    const voting = await prisma.voting.findFirst({
      where: { id: { startsWith: shortVotingId }, status: { in: ["ACTIVE", "CLOSED"] } },
      include: { group: { select: { fixedPrice: true } } },
    });
    
    if (!voting) {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено");
      return;
    }
    
    const cost = voting.group.fixedPrice || 1;
    
    if (user.balance < cost) {
      await answerCallback(callbackQuery.id, `❌ Недостаточно занятий на балансе (нужно ${cost}, есть ${user.balance})`);
      return;
    }
    
    // Проверяем, что пользователь голосовал и ещё не платил
    const votes = await prisma.vote.findMany({
      where: { votingId: voting.id, userId: user.id, refunded: false, balanceCharged: false },
    });
    
    if (votes.length === 0) {
      await answerCallback(callbackQuery.id, "⚠️ Вы не голосовали или уже оплатили");
      return;
    }
    
    // Списываем с баланса
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: cost } },
      });
      
      // Помечаем голоса как оплаченные
      await tx.vote.updateMany({
        where: { votingId: voting.id, userId: user.id, refunded: false },
        data: { balanceCharged: true },
      });
      
      await tx.balanceTransaction.create({
        data: {
          userId: user.id,
          amount: -cost,
          type: "VOTE_DEDUCTION",
          description: `Списание за голосование: ${voting.title}`,
          votingId: voting.id,
        },
      });
    });
    
    await answerCallback(callbackQuery.id, `✅ Списано ${cost} зан. с баланса. Осталось: ${user.balance - cost}`);
  } catch (error) {
    console.error("[WEBHOOK] handleFixedPayBalance error:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка списания");
  }
}

// DYNAMIC: Оплатить картой (после финализации)
async function handleDynamicPayCard(callbackQuery: any, shortVotingId: string, optionIndex: number) {
  const chatId = callbackQuery.message.chat.id;
  const telegramUserId = callbackQuery.from.id.toString();
  
  try {
    const user = await prisma.user.findFirst({ where: { telegramId: telegramUserId } });
    if (!user) {
      await answerCallback(callbackQuery.id, "❌ Отправьте /start для регистрации");
      return;
    }
    
    const voting = await prisma.voting.findFirst({
      where: { id: { startsWith: shortVotingId }, status: "FINALIZED" },
      include: { options: { orderBy: { id: "asc" } } },
    });
    
    if (!voting) {
      await answerCallback(callbackQuery.id, "❌ Голосование не найдено или не финализировано");
      return;
    }
    
    const option = voting.options[optionIndex];
    if (!option || !option.finalPrice) {
      await answerCallback(callbackQuery.id, "❌ Цена не назначена для этого варианта");
      return;
    }
    
    await createTelegramInvoice(chatId.toString(), {
      title: `Оплата: ${voting.title}`,
      description: `${option.time} — ${option.finalPrice}₽`,
      payload: `dynvote_${voting.id}_${option.id}_${user.id}`,
      amount: option.finalPrice * 100, // копейки
      currency: "RUB",
    });
    
    await answerCallback(callbackQuery.id, "💳 Открываю оплату...");
  } catch (error) {
    console.error("[WEBHOOK] handleDynamicPayCard error:", error);
    await answerCallback(callbackQuery.id, "❌ Ошибка создания счёта");
  }
}

// Обработка запроса на оплату (legacy)
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
  // Сохраняем числовой chatId для будущих API-вызовов
  await autoSaveChatId(chatId);
  
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
  
  // Поддерживаемые payload: voting_{id}_{userId}, dynvote_{id}_{optId}_{userId}
  if (payload.startsWith("voting_") || payload.startsWith("dynvote_")) {
    const parts = payload.split("_");
    const userId = parts[parts.length - 1]; // userId всегда последний
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user) {
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
        error_message: "Ошибка: пользователь не найден"
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
  
  try {
    const user = await prisma.user.findFirst({
      where: { telegramId: telegramUserId }
    });
    
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Ошибка: пользователь не найден");
      return;
    }
    
    // FIXED voting payment: voting_{votingId}_{userId}
    if (payload.startsWith("voting_")) {
      const parts = payload.split("_");
      const votingId = parts[1];
      
      const voting = await prisma.voting.findUnique({
        where: { id: votingId },
        include: { group: { select: { fixedPrice: true } } }
      });
      
      if (!voting) {
        await sendTelegramMessage(chatId, "❌ Ошибка: голосование не найдено");
        return;
      }
      
      const classesCount = voting.group.fixedPrice || 1;
      
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            userId: user.id,
            amount: payment.total_amount / 100,
            status: "COMPLETED",
            provider: "telegram",
            classesCount,
          }
        });
        
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: classesCount } }
        });
        
        // Сразу списываем за голосование
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { decrement: classesCount } }
        });
        
        await tx.vote.updateMany({
          where: { votingId: voting.id, userId: user.id, refunded: false },
          data: { balanceCharged: true, paidAmount: payment.total_amount / 100, paidAt: new Date() },
        });
        
        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            amount: classesCount,
            type: "PAYMENT_CREDIT",
            description: `Оплата через Telegram: ${voting.title}`
          }
        });
        
        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            amount: -classesCount,
            type: "VOTE_DEDUCTION",
            description: `Списание за голосование: ${voting.title}`,
            votingId: voting.id,
          }
        });
      });
      
      await sendTelegramMessage(
        chatId,
        `✅ *Оплата успешна!*\n\n💰 Сумма: ${payment.total_amount / 100}₽\n\nВаше участие в "${voting.title}" подтверждено!`
      );
    }
    
    // DYNAMIC voting payment: dynvote_{votingId}_{optionId}_{userId}
    else if (payload.startsWith("dynvote_")) {
      const parts = payload.split("_");
      const votingId = parts[1];
      const optionId = parts[2];
      
      const voting = await prisma.voting.findUnique({ where: { id: votingId } });
      
      if (!voting) {
        await sendTelegramMessage(chatId, "❌ Ошибка: голосование не найдено");
        return;
      }
      
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            userId: user.id,
            amount: payment.total_amount / 100,
            status: "COMPLETED",
            provider: "telegram",
            classesCount: 1,
          }
        });
        
        // Помечаем голос как оплаченный
        await tx.vote.updateMany({
          where: { votingId, optionId, userId: user.id, refunded: false },
          data: { paidAmount: payment.total_amount / 100, paidAt: new Date() },
        });
        
        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            amount: payment.total_amount / 100,
            type: "PAYMENT_CREDIT",
            description: `Оплата за занятие (динамич.): ${voting.title}`
          }
        });
      });
      
      await sendTelegramMessage(
        chatId,
        `✅ *Оплата успешна!*\n\n💰 Сумма: ${payment.total_amount / 100}₽\n\nВаше участие в "${voting.title}" подтверждено!`
      );
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing payment:", error);
    await sendTelegramMessage(
      chatId,
      "❌ Произошла ошибка при обработке платежа. Обратитесь к тренеру."
    );
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

    // Обработка ответов на нативный Poll
    if (update.poll_answer) {
      await handlePollAnswer(update.poll_answer);
      return NextResponse.json({ ok: true });
    }

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

      // Автосохранение chatId при любом сообщении из группы
      if (isGroup) {
        autoSaveChatId(chatId).catch(err => console.error("[WEBHOOK] autoSaveChatId error:", err));
      }

      // В группах Telegram добавляет @botname к командам: /start@Yom23_bot
      // Извлекаем чистую команду
      const command = text.split("@")[0].split(" ")[0].toLowerCase();

      // Команда /start
      if (command === "/start") {
        await handleStart(chatId, from, isGroup);
      }
      // Команда /help
      else if (command === "/help") {
        await handleHelp(chatId, isGroup);
      }
      // Команда /balance
      else if (command === "/balance") {
        await handleBalance(chatId, from);
      }
      // Команда /schedule
      else if (command === "/schedule") {
        await handleSchedule(chatId, isGroup);
      }
      // Команда /vote
      else if (command === "/vote") {
        await handleVote(chatId, from);
      }
      // Команда для группы - показать расписание группы
      else if (isGroup && command === "/groupschedule") {
        await handleGroupSchedule(chatId);
      }
      // Команда для группы - статистика
      else if (isGroup && command === "/stats") {
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
