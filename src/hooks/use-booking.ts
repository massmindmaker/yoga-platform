'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchWithRetry } from "@/lib/fetch";

interface BookingData {
  id: string;
  userId: string;
  classId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  createdAt: string;
}



export function useBooking(userId?: string) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const data = await fetchWithRetry<{ success: boolean; data?: BookingData[]; error?: string }>(
        `/api/bookings?userId=${userId}`,
        undefined,
        3
      );
      
      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети после 3 попыток");
      console.error("Error fetching bookings after retries:", err);
    } finally {
      setIsLoading(false);
      setRetryCount(0);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const bookClass = useCallback(async (classId: string, bookUserId: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithRetry<{ success: boolean; data?: BookingData; error?: string; code?: string }>(
        "/api/bookings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, userId: bookUserId }),
        },
        1
      );

      if (data.success) {
        toast.success('Запись подтверждена!', {
          description: 'Вы успешно записались на занятие',
        });
        await fetchBookings();
        return { success: true };
      } else {
        if (data.code === "NO_BALANCE") {
          return { success: false, error: data.error, code: 'NO_BALANCE' };
        }
        toast.error('Ошибка записи', { description: data.error });
        return { success: false, error: data.error };
      }
    } catch (err) {
      toast.error('Ошибка сети после 3 попыток');
      console.error("Error booking class after retries:", err);
      return { success: false, error: 'Ошибка сети' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithRetry<{ success: boolean; error?: string }>(
        `/api/bookings?id=${bookingId}`,
        { method: 'DELETE' },
        3
      );

      if (data.success) {
        toast.success('Запись отменена');
        await fetchBookings();
      } else {
        toast.error('Ошибка отмены', { description: data.error });
      }
    } catch (err) {
      toast.error('Ошибка сети после 3 попыток');
      console.error("Error cancelling booking after retries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    bookClass,
    cancelBooking,
    refetch: fetchBookings,
  };
}
