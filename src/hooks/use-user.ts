'use client';

import { useState, useEffect } from 'react';
import { Student, Trainer } from '../types';
import { mockStudents, mockTrainers } from '../lib/mock-data';

interface UseUserReturn {
  user: Student | Trainer | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUser(userId?: string): UseUserReturn {
  const [user, setUser] = useState<Student | Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchUser = () => {
      setIsLoading(true);
      setError(null);

      setTimeout(() => {
        try {
          // For demo, return first student or trainer based on userId
          const targetId = userId || '1';
          const student = mockStudents.find(s => s.id === targetId);
          const trainer = mockTrainers.find(t => t.id === targetId);
          
          setUser(student || trainer || mockStudents[0]);
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to fetch user'));
          setIsLoading(false);
        }
      }, 500);
    };

    fetchUser();
  }, [userId]);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
    // Re-trigger the effect
    setUser(null);
  };

  return { user, isLoading, error, refetch };
}
