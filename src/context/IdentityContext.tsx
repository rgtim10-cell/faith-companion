import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Lightweight in-memory store — same interface as CovenantContext storage.
// Swap for AsyncStorage calls to add cross-session persistence.
const _store = new Map<string, string>();
const storage = {
  getItem: async (key: string): Promise<string | null> => _store.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => { _store.set(key, value); },
};

const SUPPRESSED_KEY = 'oath:identity:suppressed';
const CHALLENGED_KEY = 'oath:identity:challenged';

export interface ChallengedTrait {
  traitId: string;
  correctionNote: string;
  challengedAt: number;
}

interface IdentityContextValue {
  suppressedTraitIds: string[];
  challengedTraits: ChallengedTrait[];
  suppressTrait: (traitId: string) => void;
  clearSuppress: (traitId: string) => void;
  challengeTrait: (traitId: string, correctionNote: string) => void;
  clearChallenge: (traitId: string) => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [suppressedTraitIds, setSuppressedTraitIds] = useState<string[]>([]);
  const [challengedTraits, setChallengedTraits] = useState<ChallengedTrait[]>([]);

  useEffect(() => {
    async function load() {
      const [suppRaw, challRaw] = await Promise.all([
        storage.getItem(SUPPRESSED_KEY),
        storage.getItem(CHALLENGED_KEY),
      ]);
      if (suppRaw) setSuppressedTraitIds(JSON.parse(suppRaw) as string[]);
      if (challRaw) setChallengedTraits(JSON.parse(challRaw) as ChallengedTrait[]);
    }
    load();
  }, []);

  const suppressTrait = useCallback((traitId: string) => {
    setSuppressedTraitIds((prev) => {
      if (prev.includes(traitId)) return prev;
      const next = [...prev, traitId];
      storage.setItem(SUPPRESSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearSuppress = useCallback((traitId: string) => {
    setSuppressedTraitIds((prev) => {
      const next = prev.filter((id) => id !== traitId);
      storage.setItem(SUPPRESSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const challengeTrait = useCallback((traitId: string, correctionNote: string) => {
    setChallengedTraits((prev) => {
      // Replace any existing challenge for the same trait
      const filtered = prev.filter((c) => c.traitId !== traitId);
      const next = [...filtered, { traitId, correctionNote, challengedAt: Date.now() }];
      storage.setItem(CHALLENGED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearChallenge = useCallback((traitId: string) => {
    setChallengedTraits((prev) => {
      const next = prev.filter((c) => c.traitId !== traitId);
      storage.setItem(CHALLENGED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ suppressedTraitIds, challengedTraits, suppressTrait, clearSuppress, challengeTrait, clearChallenge }),
    [suppressedTraitIds, challengedTraits, suppressTrait, clearSuppress, challengeTrait, clearChallenge],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used inside IdentityProvider');
  return ctx;
}
