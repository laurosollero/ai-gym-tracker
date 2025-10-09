import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, WorkoutSession } from "./types";

interface AppState {
  // User state
  user: User | null;
  isUserLoading: boolean;

  // Current workout session
  currentSession: WorkoutSession | null;
  isSessionActive: boolean;

  // Rest timer
  restTimer: {
    isActive: boolean;
    remainingSeconds: number;
    totalSeconds: number;
  };

  // Actions
  setUser: (user: User | null) => void;
  setUserLoading: (loading: boolean) => void;
  setCurrentSession: (session: WorkoutSession | null) => void;
  setSessionActive: (active: boolean) => void;
  startRestTimer: (seconds: number) => void;
  updateRestTimer: (remainingSeconds: number) => void;
  stopRestTimer: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isUserLoading: true,
      currentSession: null,
      isSessionActive: false,
      restTimer: {
        isActive: false,
        remainingSeconds: 0,
        totalSeconds: 0,
      },

      // Actions
      setUser: (user) => set({ user }),
      setUserLoading: (loading) => set({ isUserLoading: loading }),
      setCurrentSession: (session) => set({ currentSession: session }),
      setSessionActive: (active) => set({ isSessionActive: active }),

      startRestTimer: (seconds) =>
        set({
          restTimer: {
            isActive: true,
            remainingSeconds: seconds,
            totalSeconds: seconds,
          },
        }),

      updateRestTimer: (remainingSeconds) =>
        set((state) => ({
          restTimer: {
            ...state.restTimer,
            remainingSeconds,
            isActive: remainingSeconds > 0,
          },
        })),

      stopRestTimer: () =>
        set({
          restTimer: {
            isActive: false,
            remainingSeconds: 0,
            totalSeconds: 0,
          },
        }),
    }),
    {
      name: "ai-gym-tracker-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        currentSession: state.currentSession,
        isSessionActive: state.isSessionActive,
        // Don't persist rest timer (it should reset on refresh)
        // Don't persist isUserLoading (should always start as true)
      }),
    },
  ),
);
