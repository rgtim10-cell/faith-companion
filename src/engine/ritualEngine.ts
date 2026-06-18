import type { MemoryRecord } from '@/data/memoryGraph';
import type { Covenant } from '@/data/memoryGraph';
import type { DailyRecord } from '@/data/dailyRecord';
import type { OathState } from './oathState';

const DAY = 24 * 60 * 60 * 1000;

function recent(memories: MemoryRecord[], days: number): MemoryRecord[] {
  const cutoff = Date.now() - days * DAY;
  return memories.filter((m) => m.date > cutoff);
}

// ── Reflection question ────────────────────────────────────────
// One context-aware question from OATH. Not a form prompt —
// a question that knows something about today.

export function generateReflectionQuestion(
  oathState: OathState,
  memories: MemoryRecord[],
  covenant: Covenant | null,
): string {
  const today = recent(memories, 1);
  const last3 = recent(memories, 3);

  const todayStruggles = today.filter((m) => m.type === 'struggle');
  const todayWins = today.filter((m) => m.type === 'breakthrough' || m.type === 'evidence');
  const recentStruggle = last3.find((m) => m.type === 'struggle');
  const recentBreakthrough = last3.find((m) => m.type === 'breakthrough');

  // State: concerned — something is being carried
  if (oathState.key === 'concerned') {
    if (todayStruggles.length > 0) {
      return "You went quiet today. What happened?";
    }
    if (recentStruggle) {
      return "You've been carrying something. Did today add to it, or ease it?";
    }
    return "Something has been heavy lately. What was today like?";
  }

  // State: proud — strong record, consistent wins
  if (oathState.key === 'proud') {
    return "The record is building. What happened today that OATH should hold?";
  }

  // State: encouraged — momentum
  if (oathState.key === 'encouraged') {
    if (recentBreakthrough) {
      return "You broke through something recently. What came next today?";
    }
    return "There's momentum in the record. What moved today?";
  }

  // State: challenging — strong record, quiet lately
  if (oathState.key === 'challenging') {
    return "You've been quiet. What's really going on?";
  }

  // State: curious — pattern emerging
  if (oathState.key === 'curious') {
    return "Something is taking shape. What did you notice today?";
  }

  // Today had wins
  if (todayWins.length > 0) {
    return "Today moved. What do you want OATH to remember about it?";
  }

  // Covenant exists — tie back to the promise
  if (covenant) {
    return "You made a promise. What did today add to it?";
  }

  // Default: open
  return "What happened today that OATH should remember?";
}

// ── Morning return ─────────────────────────────────────────────
// A single line shown the morning after a sealed day.
// No streaks. Continuity language only.

export function generateMorningReturn(
  yesterday: DailyRecord,
  memories: MemoryRecord[],
): string {
  // If yesterday had a reflection, reference it specifically
  if (yesterday.reflectionId) {
    const reflection = memories.find((m) => m.id === yesterday.reflectionId);
    if (reflection) {
      const lower = reflection.content.toLowerCase();
      const hasStruggle = /hard|difficult|struggle|fail|doubt|lost|wrong|couldn|couldn't/i.test(lower);
      const hasWin = /good|great|proud|broke|won|finished|managed|did it|showed up/i.test(lower);
      if (hasStruggle) {
        return "Yesterday ended with difficulty. This morning begins with choice.";
      }
      if (hasWin) {
        return "Yesterday is still here. OATH remembers what you told it.";
      }
      return "Last night, you told OATH something important. The record continues.";
    }
  }

  // No reflection — base return on yesterday's state
  switch (yesterday.oathStateKey) {
    case 'proud':
      return "Yesterday was a good day. The record shows it.";
    case 'concerned':
      return "Yesterday was hard. OATH is still watching.";
    case 'encouraged':
      return "Yesterday had momentum. OATH is paying attention.";
    case 'challenging':
      return "The record is strong. Yesterday was quiet. Today is open.";
    default:
      return "OATH remembers yesterday. The record continues.";
  }
}

// ── Closing lines ──────────────────────────────────────────────
// OATH's last word after the reflection is sealed.

export function selectClosingLine(
  oathState: OathState,
  reflectionContent: string,
): string {
  const lower = reflectionContent.toLowerCase();
  const hasStruggle = /hard|difficult|struggle|fail|doubt|lost|wrong|couldn|tired|heavy/i.test(lower);
  const hasWin = /good|great|proud|broke|won|finished|managed|did it|showed up|made it/i.test(lower);

  if (hasStruggle && hasWin) {
    return "OATH sees both. The record holds all of it.";
  }

  if (hasStruggle) {
    switch (oathState.key) {
      case 'concerned': return "You named it. That is the first act of return.";
      case 'proud':     return "Even the hard days are part of the record.";
      default:          return "OATH holds this. Come back tomorrow.";
    }
  }

  if (hasWin) {
    switch (oathState.key) {
      case 'proud':       return "You showed up. OATH will remember.";
      case 'encouraged':  return "That is enough. The record will hold this.";
      default:            return "You moved today. OATH noticed.";
    }
  }

  // Neutral — state-driven
  switch (oathState.key) {
    case 'proud':       return "The covenant is being kept. Rest.";
    case 'concerned':   return "Naming it is enough. OATH will watch tonight.";
    case 'encouraged':  return "The record is alive. Come back tomorrow.";
    case 'challenging': return "The record asked something of you today. You answered.";
    case 'curious':     return "OATH is still paying attention. Rest.";
    default:            return "OATH will remember this. Rest.";
  }
}
