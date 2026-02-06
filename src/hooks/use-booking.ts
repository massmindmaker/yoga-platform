'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BookingData {
  id: string;
  userId: string;
  classId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  createdAt: string;
}

interface UseBookingReturn {
  bookings: BookingData[];
  isLoading: boolean;
  error: Error | null;
  bookClass: (classId: string, userId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  refetch: () => void;
}

export function useBooking(userId?: string): UseBookingReturn {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      // When /api/bookings endpoint is added, fetch from there
      setBookings([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bookings'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const bookClass = useCallback(async (classId: string, userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: POST /api/bookings
      toast.success('Запись подтверждена!', {
        description: 'Вы успешно записались на занятие',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to book class');
      setError(error);
      toast.error('Ошибка записи', { description: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: PATCH /api/bookings/:id/cancel
      toast.success('Запись отменена', {
        description: 'Ваше бронирование успешно отменено',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel booking');
      setError(error);
      toast.error('Ошибка отмены', { description: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bookings,
    isLoading,
    error,
    bookClass,
    cancelBooking,
    refetch: fetchBookings,
  };
}
