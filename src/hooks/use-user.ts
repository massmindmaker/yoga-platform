'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserData {
  id: string;
  telegramId: string | null;
  firstName: string;
  lastName: string | null;
  username?: string;
  role: 'STUDENT' | 'TRAINER' | 'ADMIN';
  balance: number;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseUserReturn {
  user: UserData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUser(userId?: string): UseUserReturn {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}`);
      const json = await res.json();

      if (json.success && json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, refetch: fetchUser };
}
