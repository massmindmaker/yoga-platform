'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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

  const fetchBookings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      setError("Ошибка сети");
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const bookClass = useCallback(async (classId: string, bookUserId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, userId: bookUserId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Запись подтверждена!', {
          description: 'Вы успешно записались на занятие',
        });
        await fetchBookings();
      } else {
        toast.error('Ошибка записи', { description: data.error });
      }
    } catch (err) {
      toast.error('Ошибка сети');
      console.error("Error booking class:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Запись отменена');
        await fetchBookings();
      } else {
        toast.error('Ошибка отмены', { description: data.error });
      }
    } catch (err) {
      toast.error('Ошибка сети');
      console.error("Error cancelling booking:", err);
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
