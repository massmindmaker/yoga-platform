'use client';

import { useState, useEffect } from 'react';
import { YogaClass } from '../types';
import { mockYogaClasses } from '../lib/mock-data';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UseScheduleReturn {
  classes: YogaClass[];
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSchedule(): UseScheduleReturn {
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Generate week days
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    setWeekDays(days);

    // Simulate API call
    const fetchSchedule = () => {
      setIsLoading(true);
      setError(null);

      setTimeout(() => {
        try {
          // Filter classes for the selected date
          const filteredClasses = mockYogaClasses.filter(
            yogaClass => isSameDay(yogaClass.date, selectedDate)
          );
          setClasses(filteredClasses);
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to fetch schedule'));
          setIsLoading(false);
        }
      }, 300);
    };

    fetchSchedule();
  }, [selectedDate]);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
    // Re-trigger the effect
    setClasses([]);
  };

  return {
    classes,
    weekDays,
    selectedDate,
    setSelectedDate,
    isLoading,
    error,
    refetch,
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
