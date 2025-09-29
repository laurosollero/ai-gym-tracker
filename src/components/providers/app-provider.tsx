'use client';

import { useEffect } from 'react';
import { initializeDatabase } from '@/lib/db/seed';
import { userRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setUserLoading } = useAppStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeDatabase();
        const user = await userRepository.getCurrentUser();
        setUser(user || null);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setUserLoading(false);
      }
    };

    initApp();
  }, [setUser, setUserLoading]);

  return <>{children}</>;
}