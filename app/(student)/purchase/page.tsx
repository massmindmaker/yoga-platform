"use client";

import { toast } from "sonner";
import { motion } from "framer-motion";
import { Minus, Plus, Wallet, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser } from "@/src/hooks/use-user-context";
import { usePayments } from "@/src/hooks/use-payments";

const PRICE_PER_CLASS = 700;

export default function PurchasePage() {
  const [count, setCount] = useState(4);
  const { user } = useUser();
  const { createPayment, isLoading } = usePayments();

  const total = count * PRICE_PER_CLASS;

  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error("Необходимо авторизоваться");
      return;
    }

    const result = await createPayment(
      user.id,
      total,
      count,
      user.telegramId || undefined
    );

    if (result.success) {
      toast.success("Перенаправляем на страницу оплаты...");
    } else {
      if (result.error === "T-Bank credentials not configured") {
        toast.error("Оплата временно недоступна", {
          description: "Платёжная система ещё не настроена",
        });
      } else {
        toast.error("Ошибка создания платежа", {
          description: result.error,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Купить занятия"
        backHref="/"
      />

      <div className="p-6">
        {/* Счетчик */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-2">Количество занятий</p>
            <div className="flex items-center justify-center gap-6">
              <motion.button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Minus className="w-6 h-6" />
              </motion.button>

              <motion.span
                key={count}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-bold text-gray-900 w-24 text-center"
              >
                {count}
              </motion.span>

              <motion.button
                onClick={() => setCount(count + 1)}
                className="w-14 h-14 rounded-2xl bg-[#F0FDF9] flex items-center justify-center text-[#3BCEAC] hover:bg-[#CCFBF1] transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* Быстрые кнопки */}
          <div className="flex justify-center gap-3 mb-8">
            {[1, 4, 8, 12].map((num) => (
              <motion.button
                key={num}
                onClick={() => setCount(num)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  count === num
                    ? "bg-[#3BCEAC] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {num}
              </motion.button>
            ))}
          </div>

          {/* Расчет */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Цена за занятие</span>
              <span className="font-medium">{PRICE_PER_CLASS} ₽</span>
            </div>
            <div className="flex justify-between items-center text-xl">
              <span className="font-semibold text-gray-900">Итого</span>
              <span className="font-bold text-[#3BCEAC]">{total.toLocaleString()} ₽</span>
            </div>
          </div>
        </motion.div>

        {/* Информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#F0FDF9] rounded-2xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-[#3BCEAC] mt-0.5" />
            <div>
              <p className="text-sm text-[#0F766E] font-medium mb-1">
                Как это работает:
              </p>
              <ul className="text-sm text-[#0D9488] space-y-1">
                <li>• Занятия не сгорают</li>
                <li>• Можно заморозить на 2 недели</li>
                <li>• Безопасная оплата через T-Bank</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Кнопка оплаты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed bottom-20 left-4 right-4"
        >
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#3BCEAC] to-[#2DD4BF] text-white h-14 rounded-2xl font-semibold text-lg shadow-xl disabled:opacity-50"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Создаём платёж...
              </>
            ) : (
              `Оплатить ${total.toLocaleString()} ₽`
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
