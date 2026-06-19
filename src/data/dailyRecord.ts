import type { OathStateKey } from '@/engine/oathState';

export interface DailyRecord {
  id: string;
  date: string;               // 'YYYY-MM-DD'
  oathStateKey: OathStateKey;
  reflectionId?: string;      // MemoryRecord.id of the night reflection
  closingLine: string;
  strongestMemoryId?: string;
  covenantId?: string;
  carryForwardMemoryIds: string[];
}

export function toDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDayKey(d);
}
