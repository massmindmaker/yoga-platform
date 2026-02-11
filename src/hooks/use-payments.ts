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

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Max retries exceeded');
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

      const data = await fetchWithRetry<{
        success: boolean;
        paymentUrl?: string;
        paymentId?: string;
        error?: string;
      }>(
        "/api/payments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            amount,
            classesCount,
            telegramId,
          }),
        },
        3
      );

      if (data.success) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
        return { success: true, paymentId: data.paymentId };
      } else {
        setError(data.error || "Failed to create payment");
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error creating payment after retries:", err);
      setError("Network error after 3 retries");
      return { success: false, error: "Network error after 3 retries" };
    } finally {
      setIsLoading(false);
    }
  };

  const getPayments = async (userId: string): Promise<Payment[]> => {
    try {
      const data = await fetchWithRetry<{ success: boolean; data?: Payment[] }>(
        `/api/payments?userId=${userId}`,
        undefined,
        3
      );

      if (data.success) {
        return data.data || [];
      } else {
        return [];
      }
    } catch (err) {
      console.error("Error fetching payments after retries:", err);
      return [];
    }
  };

  return { createPayment, getPayments, isLoading, error };
}
