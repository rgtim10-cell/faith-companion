import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { OathStateKey } from '@/engine/oathState';
import type { DailyRecord } from '@/data/dailyRecord';
import { toDayKey, yesterdayKey } from '@/data/dailyRecord';

const _store = new Map<string, string>();
const storage = {
  getItem: async (key: string): Promise<string | null> => _store.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => { _store.set(key, value); },
};

const dailyStorageKey = (date: string) => `oath:daily:${date}`;

export interface SealDayParams {
  oathStateKey: OathStateKey;
  reflectionId?: string;
  closingLine: string;
  strongestMemoryId?: string;
  covenantId?: string;
  carryForwardMemoryIds?: string[];
}

interface DailyContextValue {
  today: DailyRecord | null;
  yesterday: DailyRecord | null;
  isSealed: boolean;
  sealDay: (params: SealDayParams) => Promise<DailyRecord>;
}

const DailyContext = createContext<DailyContextValue | null>(null);

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState<DailyRecord | null>(null);
  const [yesterday, setYesterday] = useState<DailyRecord | null>(null);

  useEffect(() => {
    async function load() {
      const [todayRaw, yRaw] = await Promise.all([
        storage.getItem(dailyStorageKey(toDayKey())),
        storage.getItem(dailyStorageKey(yesterdayKey())),
      ]);
      if (todayRaw) setToday(JSON.parse(todayRaw) as DailyRecord);
      if (yRaw) setYesterday(JSON.parse(yRaw) as DailyRecord);
    }
    load();
  }, []);

  const sealDay = useCallback(async (params: SealDayParams): Promise<DailyRecord> => {
    const record: DailyRecord = {
      id: `day_${Date.now()}`,
      date: toDayKey(),
      oathStateKey: params.oathStateKey,
      reflectionId: params.reflectionId,
      closingLine: params.closingLine,
      strongestMemoryId: params.strongestMemoryId,
      covenantId: params.covenantId,
      carryForwardMemoryIds: params.carryForwardMemoryIds ?? [],
    };
    setToday(record);
    await storage.setItem(dailyStorageKey(record.date), JSON.stringify(record));
    return record;
  }, []);

  const value = useMemo(
    () => ({ today, yesterday, isSealed: today !== null, sealDay }),
    [today, yesterday, sealDay],
  );

  return <DailyContext.Provider value={value}>{children}</DailyContext.Provider>;
}

export function useDaily(): DailyContextValue {
  const ctx = useContext(DailyContext);
  if (!ctx) throw new Error('useDaily must be used inside DailyProvider');
  return ctx;
}
