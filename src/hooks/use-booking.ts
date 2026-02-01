'use client';

import { useState, useCallback } from 'react';
import { Booking, BookingStatus } from '../types';
import { mockBookings } from '../lib/mock-data';
import { toast } from 'sonner';

interface UseBookingReturn {
  bookings: Booking[];
  isLoading: boolean;
  error: Error | null;
  bookClass: (classId: string, studentId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  refetch: () => void;
}

export function useBooking(studentId?: string): UseBookingReturn {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simulate fetching bookings
  const fetchBookings = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const filteredBookings = studentId
          ? mockBookings.filter(b => b.studentId === studentId)
          : mockBookings;
        setBookings(filteredBookings);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch bookings'));
        setIsLoading(false);
      }
    }, 300);
  }, [studentId]);

  const bookClass = useCallback(async (classId: string, studentId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Check if already booked
          const existingBooking = mockBookings.find(
            b => b.classId === classId && b.studentId === studentId && b.status === 'confirmed'
          );

          if (existingBooking) {
            throw new Error('Вы уже записаны на это занятие');
          }

          // Create new booking
          const newBooking: Booking = {
            id: `booking-${Date.now()}`,
            studentId,
            student: mockBookings[0].student,
            classId,
            yogaClass: mockBookings[0].yogaClass,
            status: 'confirmed',
            bookedAt: new Date(),
          };

          mockBookings.push(newBooking);
          setBookings(prev => [...prev, newBooking]);
          
          toast.success('Запись подтверждена!', {
            description: 'Вы успешно записались на занятие',
          });
          
          setIsLoading(false);
          resolve();
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to book class');
          setError(error);
          toast.error('Ошибка записи', {
            description: error.message,
          });
          setIsLoading(false);
          reject(error);
        }
      }, 500);
    });
  }, []);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
          
          if (bookingIndex === -1) {
            throw new Error('Бронирование не найдено');
          }

          // Update booking status
          mockBookings[bookingIndex].status = 'cancelled';
          mockBookings[bookingIndex].cancelledAt = new Date();

          setBookings(prev => 
            prev.map(b => 
              b.id === bookingId 
                ? { ...b, status: 'cancelled' as BookingStatus, cancelledAt: new Date() }
                : b
            )
          );

          toast.success('Запись отменена', {
            description: 'Ваше бронирование успешно отменено',
          });

          setIsLoading(false);
          resolve();
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to cancel booking');
          setError(error);
          toast.error('Ошибка отмены', {
            description: error.message,
          });
          setIsLoading(false);
          reject(error);
        }
      }, 500);
    });
  }, []);

  const refetch = useCallback(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    bookClass,
    cancelBooking,
    refetch,
  };
}
