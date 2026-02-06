'use client';

import { useState, useEffect, useCallback } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ScheduleClass {
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
}

interface UseScheduleReturn {
  classes: ScheduleClass[];
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSchedule(): UseScheduleReturn {
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    setWeekDays(days);
  }, []);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, no schedule API exists — show empty
      // When /api/classes endpoint is added, fetch from there
      setClasses([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch schedule'));
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
