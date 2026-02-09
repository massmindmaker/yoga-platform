'use client';

import { useState, useEffect, useCallback } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface ScheduleClass {
  id: string;
  scheduleId: string;
  trainerId: string;
  date: string;
  maxStudents: number;
  price: number;
  status: string;
  schedule: {
    id: string;
    groupId: string;
    dayOfWeek: number;
    time: string;
    description: string | null;
    group: {
      id: string;
      name: string;
    };
  };
  trainer: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
  _count: {
    bookings: number;
  };
  bookings?: Array<{
    id: string;
    userId: string;
    status: string;
  }>;
}

interface UseScheduleReturn {
  classes: ScheduleClass[];
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSchedule(): UseScheduleReturn {
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
    setWeekDays(days);
  }, []);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/classes?from=${dateStr}&to=${dateStr}`);
      const data = await response.json();

      if (data.success) {
        setClasses(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Ошибка загрузки расписания');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    classes,
    weekDays,
    selectedDate,
    setSelectedDate,
    isLoading,
    error,
    refetch: fetchSchedule,
  };
}

export function useFormattedDate(date: Date): string {
  return format(date, 'EEEE, d MMMM', { locale: ru });
}

export function useShortDayName(date: Date): string {
  return format(date, 'EEE', { locale: ru });
}

export function useDayNumber(date: Date): string {
  return format(date, 'd');
}
