import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { TheaterExperience, TheaterExperienceType } from '@/data/theaterExperience';

interface TheaterContextValue {
  currentExperience: TheaterExperience | null;
  shownTypes: TheaterExperienceType[];
  canPresent: boolean;         // false after first present in session
  presentExperience: (exp: TheaterExperience) => void;
  dismissExperience: () => void;
}

const TheaterContext = createContext<TheaterContextValue | null>(null);

export function TheaterProvider({ children }: { children: React.ReactNode }) {
  const [currentExperience, setCurrentExperience] = useState<TheaterExperience | null>(null);
  const [shownTypes, setShownTypes] = useState<TheaterExperienceType[]>([]);
  const [sessionPresented, setSessionPresented] = useState(false);

  const presentExperience = useCallback((exp: TheaterExperience) => {
    setCurrentExperience(exp);
    setShownTypes((prev) => [...prev, exp.type]);
    setSessionPresented(true);
  }, []);

  const dismissExperience = useCallback(() => {
    setCurrentExperience(null);
  }, []);

  const value = useMemo(
    () => ({
      currentExperience,
      shownTypes,
      canPresent: !sessionPresented,
      presentExperience,
      dismissExperience,
    }),
    [currentExperience, shownTypes, sessionPresented, presentExperience, dismissExperience],
  );

  return <TheaterContext.Provider value={value}>{children}</TheaterContext.Provider>;
}

export function useTheater(): TheaterContextValue {
  const ctx = useContext(TheaterContext);
  if (!ctx) throw new Error('useTheater must be used inside TheaterProvider');
  return ctx;
}
