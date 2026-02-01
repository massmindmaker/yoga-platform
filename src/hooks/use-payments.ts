"use client";

import { useState } from "react";

interface Payment {
  id: string;
  amount: number;
  classesCount: number;
  status: string;
  provider: string;
  createdAt: string;
}

export function usePayments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (
    userId: string,
    amount: number,
    classesCount: number,
    telegramId?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          classesCount,
          telegramId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Перенаправляем на страницу оплаты
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
        return { success: true, paymentId: data.paymentId };
      } else {
        setError(data.error || "Failed to create payment");
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Network error");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const getPayments = async (userId: string): Promise<Payment[]> => {
    try {
      const response = await fetch(`/api/payments?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      return [];
    }
  };

  return { createPayment, getPayments, isLoading, error };
}
