import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { InterventionCandidate, InterventionType } from '@/engine/interventionEngine';
import { detectIntervention } from '@/engine/interventionEngine';
import { useCovenant } from '@/context/CovenantContext';
import { computeOathState } from '@/engine/oathState';

const _store = new Map<string, string>();
const storage = {
  getItem:  async (key: string): Promise<string | null> => _store.get(key) ?? null,
  setItem:  async (key: string, value: string): Promise<void> => { _store.set(key, value); },
};

const LAST_INTERVENTION_KEY = 'oath:last_intervention_at';
const SHOWN_TYPES_KEY       = 'oath:shown_intervention_types';

// Minimum time between any two interventions — 48 hours.
// The score threshold handles rarity within a window;
// this guard prevents accumulation on power users.
const MIN_INTERVAL_MS = 48 * 60 * 60 * 1000;

interface InterventionContextValue {
  // Raw pending intervention — null if none detected or after dismiss.
  // InterventionScreen reads this directly.
  pendingIntervention: InterventionCandidate | null;

  // Whether the banner should be shown in OathScreen.
  // Becomes false after viewIntervention() or deferIntervention().
  bannerVisible: boolean;

  viewIntervention: () => void; // User chose "View now" — marks shown, hides banner
  dismissIntervention: () => void; // User dismissed — marks shown, clears pending
  deferIntervention: () => void;  // User chose "Later" — hides banner this session only
}

const InterventionContext = createContext<InterventionContextValue | null>(null);

export function InterventionProvider({ children }: { children: React.ReactNode }) {
  const { covenant, memories, feedback } = useCovenant();
  const [pendingIntervention, setPendingIntervention] = useState<InterventionCandidate | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  // On mount (after covenant + memories are ready), evaluate the queue.
  // Runs once — interventions are detected at launch, not continuously.
  useEffect(() => {
    async function evaluate() {
      const lastAtRaw = await storage.getItem(LAST_INTERVENTION_KEY);
      const lastAt = lastAtRaw ? parseInt(lastAtRaw, 10) : 0;

      // Restraint guard — don't speak if we spoke recently
      if (Date.now() - lastAt < MIN_INTERVAL_MS) return;

      const shownRaw = await storage.getItem(SHOWN_TYPES_KEY);
      const shownTypes: InterventionType[] = shownRaw ? JSON.parse(shownRaw) : [];

      const oathState = computeOathState(memories, covenant, feedback);
      const candidate = detectIntervention(oathState, memories, covenant, shownTypes);

      if (candidate) {
        setPendingIntervention(candidate);
        setBannerVisible(true);
      }
    }

    if (!covenant || memories.length < 2) return;
    evaluate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [covenant?.id, memories.length]);

  // Mark the intervention type as shown and record the timestamp.
  // Called on both "View now" and "Dismiss".
  const recordShown = useCallback(async (type: InterventionType) => {
    const shownRaw = await storage.getItem(SHOWN_TYPES_KEY);
    const prev: InterventionType[] = shownRaw ? JSON.parse(shownRaw) : [];
    await storage.setItem(SHOWN_TYPES_KEY, JSON.stringify([...new Set([...prev, type])]));
    await storage.setItem(LAST_INTERVENTION_KEY, String(Date.now()));
  }, []);

  // "View now" — user will see the full screen.
  // Hides the banner but keeps pendingIntervention for InterventionScreen to read.
  const viewIntervention = useCallback(() => {
    if (!pendingIntervention) return;
    setBannerVisible(false);
    recordShown(pendingIntervention.type).catch(() => {});
  }, [pendingIntervention, recordShown]);

  // "Dismiss" — user doesn't want to see it.
  // Records + clears everything.
  const dismissIntervention = useCallback(() => {
    if (!pendingIntervention) return;
    recordShown(pendingIntervention.type).catch(() => {});
    setPendingIntervention(null);
    setBannerVisible(false);
  }, [pendingIntervention, recordShown]);

  // "Later" — hides banner for this session, does not record as shown.
  // Will reappear on next launch if MIN_INTERVAL has elapsed.
  const deferIntervention = useCallback(() => {
    setBannerVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      pendingIntervention,
      bannerVisible,
      viewIntervention,
      dismissIntervention,
      deferIntervention,
    }),
    [pendingIntervention, bannerVisible, viewIntervention, dismissIntervention, deferIntervention],
  );

  return <InterventionContext.Provider value={value}>{children}</InterventionContext.Provider>;
}

export function useIntervention(): InterventionContextValue {
  const ctx = useContext(InterventionContext);
  if (!ctx) throw new Error('useIntervention must be used inside InterventionProvider');
  return ctx;
}
