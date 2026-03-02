// T-Bank (Tinkoff) Payment Integration
import crypto from "crypto";

// Читаем env в момент вызова, не при загрузке модуля (важно для serverless)
function getTerminalKey() {
  return process.env.TBANK_TERMINAL_KEY;
}

function getPassword() {
  return process.env.TBANK_PASSWORD;
}

interface PaymentRequest {
  amount: number; // в копейках
  orderId: string;
  description: string;
  userId: string;
  telegramId?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

// Создать платеж
export async function createPayment(
  data: PaymentRequest
): Promise<PaymentResponse> {
  try {
    const terminalKey = getTerminalKey();
    const password = getPassword();

    if (!terminalKey || !password) {
      return { success: false, error: "T-Bank credentials not configured" };
    }

    const params = new URLSearchParams({
      TerminalKey: terminalKey,
      Amount: data.amount.toString(),
      OrderId: data.orderId,
      Description: data.description,
      NotificationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      SuccessURL: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
      FailURL: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failed`,
      DATA: JSON.stringify({
        userId: data.userId,
        telegramId: data.telegramId,
      }),
    });

    // Добавляем токен безопасности
    const token = generateToken({
      TerminalKey: terminalKey,
      Amount: data.amount.toString(),
      OrderId: data.orderId,
      Description: data.description,
      Password: password,
    });
    params.append("Token", token);

    const response = await fetch(
      "https://securepay.tinkoff.ru/v2/Init",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    const result = await response.json();

    if (result.Success) {
      return {
        success: true,
        paymentUrl: result.PaymentURL,
        paymentId: result.PaymentId,
      };
    } else {
      return {
        success: false,
        error: result.Message || "Payment creation failed",
      };
    }
  } catch (error) {
    console.error("Error creating T-Bank payment:", error);
    return { success: false, error: "Failed to create payment" };
  }
}

// Проверить статус платежа
export async function checkPaymentStatus(paymentId: string) {
  try {
    const terminalKey = getTerminalKey();
    const password = getPassword();

    if (!terminalKey || !password) {
      return { success: false, error: "T-Bank credentials not configured" };
    }

    const params = new URLSearchParams({
      TerminalKey: terminalKey,
      PaymentId: paymentId,
    });

    const token = generateToken({
      TerminalKey: terminalKey,
      PaymentId: paymentId,
      Password: password,
    });
    params.append("Token", token);

    const response = await fetch(
      "https://securepay.tinkoff.ru/v2/GetState",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { success: false, error: "Failed to check status" };
  }
}

// Генерация токена безопасности
function generateToken(params: Record<string, string>): string {
  // Сортируем параметры по ключу
  const sortedKeys = Object.keys(params).sort();
  const values = sortedKeys.map((key) => params[key]).join("");

  // SHA-256 hash
  return crypto.createHash("sha256").update(values).digest("hex");
}

// Проверка подписи webhook от T-Bank
export function verifyTBankSignature(payload: Record<string, unknown>): boolean {
  try {
    const password = getPassword();
    if (!password) {
      console.error("T-Bank password not configured");
      return false;
    }

    // Копируем payload для проверки
    const data = { ...payload };
    
    // Получаем переданную подпись
    const receivedToken = data.Token as string;
    if (!receivedToken) {
      console.error("No Token in webhook payload");
      return false;
    }
    
    // Удаляем Token из данных для проверки
    delete data.Token;
    
    // Добавляем пароль
    const paramsWithPassword = {
      ...data,
      Password: password,
    };
    
    // Сортируем и конкатенируем значения
    const sortedKeys = Object.keys(paramsWithPassword).sort();
    const values = sortedKeys.map((key) => String(paramsWithPassword[key as keyof typeof paramsWithPassword])).join("");
    
    // Вычисляем ожидаемую подпись
    const expectedToken = crypto.createHash("sha256").update(values).digest("hex");
    
    // Сравниваем подписи (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(receivedToken, "hex"),
      Buffer.from(expectedToken, "hex")
    );
  } catch (error) {
    console.error("Error verifying T-Bank signature:", error);
    return false;
  }
}

// Обработка webhook от T-Bank
export async function handlePaymentWebhook(data: {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: string;
  PaymentId: string;
  Amount: number;
  DATA?: string;
}) {
  try {
    if (!data.Success) {
      console.log("Payment failed:", data.OrderId);
      return { success: false };
    }

    // Парсим дополнительные данные
    let extraData: { userId?: string; telegramId?: string } = {};
    if (data.DATA) {
      try {
        extraData = JSON.parse(data.DATA);
      } catch {
        // ignore parse error
      }
    }

    // Обновляем баланс пользователя
    if (extraData.userId) {
      const { prisma } = await import("@/lib/db");
      const { sendPaymentMessage } = await import("@/lib/telegram");

      // Находим платеж
      const payment = await prisma.payment.findFirst({
        where: { externalId: data.PaymentId },
        include: { user: true },
      });

      if (payment && payment.status === "PENDING") {
        // Обновляем статус платежа
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED" },
        });

        // Увеличиваем баланс
        await prisma.user.update({
          where: { id: payment.userId },
          data: { balance: { increment: payment.classesCount } },
        });

        // Отправляем уведомление
        if (extraData.telegramId) {
          await sendPaymentMessage(extraData.telegramId, {
            amount: data.Amount / 100,
            classesCount: payment.classesCount,
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling webhook:", error);
    return { success: false, error: "Webhook processing failed" };
  }
}
