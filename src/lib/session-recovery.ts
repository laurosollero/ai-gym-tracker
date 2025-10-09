import { sessionRepository } from "./db/repositories";
import { useAppStore } from "./store";
import type { WorkoutSession } from "./types";

/**
 * Recovers the current workout session when the app restarts
 * This handles cases where the user switches apps and the browser refreshes
 */
export async function recoverCurrentSession(): Promise<WorkoutSession | null> {
  try {
    const {
      currentSession,
      isSessionActive,
      setCurrentSession,
      setSessionActive,
    } = useAppStore.getState();

    // If no persisted session or session not active, nothing to recover
    if (!currentSession || !isSessionActive) {
      return null;
    }

    // Check if the session was completed (has endedAt)
    if (currentSession.endedAt) {
      console.log("Session was already completed, clearing state");
      setCurrentSession(null);
      setSessionActive(false);
      return null;
    }

    // Try to reload the session from database to get latest data
    const freshSession = await sessionRepository.getSessionById(
      currentSession.id,
    );

    if (!freshSession) {
      console.log("Session not found in database, clearing state");
      setCurrentSession(null);
      setSessionActive(false);
      return null;
    }

    // Check if session is from today (don't auto-recover old sessions)
    const sessionDate = new Date(freshSession.date);
    const today = new Date();
    const isToday = sessionDate.toDateString() === today.toDateString();

    if (!isToday) {
      console.log("Session is not from today, clearing state");
      setCurrentSession(null);
      setSessionActive(false);
      return null;
    }

    // Update the store with fresh session data
    setCurrentSession(freshSession);
    console.log("Session recovered successfully:", freshSession.id);

    return freshSession;
  } catch (error) {
    console.error("Failed to recover session:", error);

    // Clear invalid session state
    const { setCurrentSession, setSessionActive } = useAppStore.getState();
    setCurrentSession(null);
    setSessionActive(false);

    return null;
  }
}

/**
 * Check if there's an active workout session
 */
export function hasActiveSession(): boolean {
  const { currentSession, isSessionActive } = useAppStore.getState();
  return !!(currentSession && isSessionActive && !currentSession.endedAt);
}

/**
 * Get the current session ID if active
 */
export function getCurrentSessionId(): string | null {
  const { currentSession, isSessionActive } = useAppStore.getState();
  return currentSession && isSessionActive && !currentSession.endedAt
    ? currentSession.id
    : null;
}
