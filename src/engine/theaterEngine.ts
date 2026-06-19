import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import type { TheaterBeat, TheaterExperience, TheaterExperienceType } from '@/data/theaterExperience';
import { detectResonance } from './resonanceEngine';

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(ts: number): number {
  return Math.round((Date.now() - ts) / DAY);
}

function excerpt(text: string, max = 120): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function voice(text: string): TheaterBeat {
  return { type: 'oath_voice', content: text };
}

function memory(record: MemoryRecord): TheaterBeat {
  return { type: 'memory', content: excerpt(record.content, 140), record };
}

function reflection(text: string): TheaterBeat {
  return { type: 'reflection', content: text };
}

function stats(text: string): TheaterBeat {
  return { type: 'stats', content: text };
}

// ── Builders ───────────────────────────────────────────────────

function buildFirstPromise(covenant: Covenant, memories: MemoryRecord[]): TheaterExperience {
  const otherMemories = memories
    .filter((m) => m.type !== 'promise')
    .sort((a, b) => a.date - b.date)
    .slice(0, 2);

  const beats: TheaterBeat[] = [
    voice('You made a promise.'),
    memory({ id: 'cov_beat', type: 'promise', title: 'Founding covenant', content: covenant.promise, date: covenant.createdAt, emotionalWeight: 1, tags: ['covenant'], source: 'covenant' }),
    voice('And then you came back.'),
  ];

  otherMemories.forEach((m, i) => {
    if (i === 0) beats.push(voice(`${daysAgo(m.date) === 0 ? 'Today' : `${daysAgo(m.date)} ${daysAgo(m.date) === 1 ? 'day' : 'days'} later`}:`));
    beats.push(memory(m));
  });

  beats.push(voice('OATH is paying attention.'));
  beats.push(reflection(
    'The hardest part of any promise is not making it. It is returning to it. You returned.',
  ));

  return {
    id: `theater_fp_${Date.now()}`,
    type: 'first_promise',
    accentColor: '#8B5CF6',
    opening: 'Something has begun.',
    beats,
    closing: 'The record has started.',
    records: [{ id: 'cov_beat', type: 'promise', title: 'Founding covenant', content: covenant.promise, date: covenant.createdAt, emotionalWeight: 1, tags: [], source: 'covenant' }, ...otherMemories],
    composedAt: Date.now(),
  };
}

function buildTurningPoint(
  breakthrough: MemoryRecord,
  struggles: MemoryRecord[],
  covenant: Covenant | null,
): TheaterExperience {
  const topStruggle = struggles.sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];
  const daysBetween = Math.round((breakthrough.date - topStruggle.date) / DAY);
  const betweenStr = daysBetween === 1 ? '1 day later' : `${daysBetween} days later`;

  const beats: TheaterBeat[] = [
    voice('Before the breakthrough:'),
    memory(topStruggle),
  ];

  if (struggles.length > 1 && struggles[1].id !== topStruggle.id) {
    beats.push(memory(struggles.sort((a, b) => a.date - b.date)[0]));
  }

  beats.push(voice(`${betweenStr}:`));
  beats.push(memory(breakthrough));
  beats.push(voice('OATH watched this happen.'));
  beats.push(reflection(
    'Turning points do not feel like turning points when you are inside them. Only after. OATH saw it then.',
  ));

  return {
    id: `theater_tp_${Date.now()}`,
    type: 'the_turning_point',
    accentColor: '#F97316',
    opening: 'Something changed.',
    beats,
    closing: 'This is in the record now.',
    records: [topStruggle, breakthrough],
    composedAt: Date.now(),
  };
}

function buildTheEcho(memories: MemoryRecord[]): TheaterExperience | null {
  const resonances = detectResonance(memories);
  const group = resonances.find((r) => r.strength >= 0.7);
  if (!group || group.memories.length < 2) return null;

  const oldest = group.memories[0];
  const newest = group.memories[group.memories.length - 1];
  const spanDays = group.spanDays;

  const beats: TheaterBeat[] = [
    voice(`Two entries. Written ${spanDays} days apart.`),
    memory(oldest),
    voice(`And then, ${spanDays} days later:`),
    memory(newest),
    voice('You wrote this without knowing you had written it before.'),
    reflection(
      'Some patterns emerge slowly. Some truths need to be found twice. OATH noticed both times.',
    ),
  ];

  return {
    id: `theater_echo_${Date.now()}`,
    type: 'the_echo',
    accentColor: '#38BDF8',
    opening: 'OATH found something.',
    beats,
    closing: 'The echo is not a coincidence.',
    records: [oldest, newest],
    composedAt: Date.now(),
  };
}

function buildRecordSoFar(days: number, covenant: Covenant, memories: MemoryRecord[]): TheaterExperience {
  const evidenceCount = memories.filter((m) => m.type === 'evidence').length;
  const breakthroughCount = memories.filter((m) => m.type === 'breakthrough').length;
  const struggleCount = memories.filter((m) => m.type === 'struggle').length;

  const strongest = [...memories]
    .filter((m) => m.type !== 'promise')
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  const covenantBeat: MemoryRecord = {
    id: 'cov_rsf_beat',
    type: 'promise',
    title: 'Founding covenant',
    content: covenant.promise,
    date: covenant.createdAt,
    emotionalWeight: 1,
    tags: [],
    source: 'covenant',
  };

  const beats: TheaterBeat[] = [
    memory(covenantBeat),
    voice(`${days} days later.`),
    stats(
      `${evidenceCount} piece${evidenceCount !== 1 ? 's' : ''} of evidence.\n${breakthroughCount} breakthrough${breakthroughCount !== 1 ? 's' : ''}.\n${struggleCount} struggle${struggleCount !== 1 ? 's' : ''} named.`,
    ),
  ];

  if (strongest) {
    beats.push(voice('The most significant entry in your record:'));
    beats.push(memory(strongest));
  }

  beats.push(reflection(
    days >= 90
      ? '90 days is not the destination. It is the proof that the direction is real.'
      : '30 days is enough time to begin. It is not enough time to finish. OATH is still watching.',
  ));

  return {
    id: `theater_rsf_${Date.now()}`,
    type: 'the_record_so_far',
    accentColor: '#34D399',
    opening: `${days} days ago, you made a promise.`,
    beats,
    closing: 'The record continues.',
    records: strongest ? [covenantBeat, strongest] : [covenantBeat],
    composedAt: Date.now(),
  };
}

function buildDocumentary(covenant: Covenant, memories: MemoryRecord[]): TheaterExperience {
  const linked = memories
    .filter((m) => m.linkedPromiseId === covenant.id && m.type !== 'promise')
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const beats: TheaterBeat[] = [];

  beats.push(voice('OATH has been keeping a record.'));

  linked.forEach((m) => {
    const d = daysAgo(m.date);
    const when = d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
    beats.push(voice(when + ':'));
    beats.push(memory(m));

    if (m.type === 'struggle') {
      beats.push(voice('This is where it was hardest.'));
    } else if (m.type === 'evidence' || m.type === 'breakthrough') {
      beats.push(voice('This is proof.'));
    }
  });

  beats.push(reflection(
    'No one else has access to this record. Only you and OATH know the full story.',
  ));

  return {
    id: `theater_doc_${Date.now()}`,
    type: 'the_documentary',
    accentColor: '#D4A853',
    opening: 'OATH has been making a record.',
    beats,
    closing: 'This is who you are becoming.',
    records: linked,
    composedAt: Date.now(),
  };
}

function buildPersonBecoming(covenant: Covenant, memories: MemoryRecord[]): TheaterExperience {
  const defining = memories
    .filter(
      (m) =>
        m.isFoundational ||
        (m.emotionalWeight >= 0.85 && m.linkedPromiseId && m.type !== 'promise'),
    )
    .sort((a, b) => a.date - b.date);

  const oldest = defining[0];
  const newest = defining[defining.length - 1];

  const beats: TheaterBeat[] = [
    voice(`There ${defining.length === 1 ? 'is' : 'are'} ${defining.length} entr${defining.length === 1 ? 'y' : 'ies'} in your record that OATH considers foundational.`),
  ];

  if (oldest) {
    beats.push(memory(oldest));
    if (oldest.id !== newest.id) {
      beats.push(voice('And then this:'));
      beats.push(memory(newest));
    }
  }

  beats.push(voice('OATH has been watching who you are becoming.'));
  beats.push(reflection(
    'The person who made the first entry and the person reading this are not the same. OATH noticed the change before you did.',
  ));

  return {
    id: `theater_pb_${Date.now()}`,
    type: 'the_person_youre_becoming',
    accentColor: '#A78BFA',
    opening: 'OATH has noticed something.',
    beats,
    closing: 'You are already that person.',
    records: defining,
    composedAt: Date.now(),
  };
}

// ── Detection ──────────────────────────────────────────────────
//
// Returns the first earned experience that hasn't been shown yet.
// Priority: first_promise → turning_point → echo → milestone → documentary → becoming
// Requires: covenant at least 5 minutes old, at least 2 non-promise memories.

export function detectTheaterExperience(
  covenant: Covenant,
  memories: MemoryRecord[],
  shownTypes: TheaterExperienceType[],
): TheaterExperience | null {
  const covenantAgeMs = Date.now() - covenant.createdAt;
  const covenantAgeDays = covenantAgeMs / DAY;

  // Minimum: 5 minutes old, 2+ non-promise memories
  if (covenantAgeMs < 5 * 60 * 1000) return null;
  const nonPromise = memories.filter((m) => m.type !== 'promise');
  if (nonPromise.length < 2) return null;

  const shown = new Set(shownTypes);

  // 1. First promise — covenant 1–10 days old, at least 2 entries
  if (covenantAgeDays <= 10 && nonPromise.length >= 2 && !shown.has('first_promise')) {
    return buildFirstPromise(covenant, memories);
  }

  // 2. Turning point — major breakthrough after at least 1 struggle
  if (!shown.has('the_turning_point')) {
    const struggles = memories.filter((m) => m.type === 'struggle' && m.emotionalWeight >= 0.6);
    const breakthrough = memories.find(
      (m) =>
        m.type === 'breakthrough' &&
        m.emotionalWeight >= 0.82 &&
        struggles.some((s) => s.date < m.date),
    );
    if (breakthrough && struggles.length >= 1) {
      const priorStruggles = struggles.filter((s) => s.date < breakthrough.date);
      if (priorStruggles.length >= 1) {
        return buildTurningPoint(breakthrough, priorStruggles, covenant);
      }
    }
  }

  // 3. The echo — resonance strength >= 0.70
  if (!shown.has('the_echo')) {
    const echo = buildTheEcho(memories);
    if (echo) return echo;
  }

  // 4. Milestone — 30-day or 90-day windows (4-day window each)
  if (!shown.has('the_record_so_far')) {
    if (covenantAgeDays >= 30 && covenantAgeDays < 34) {
      return buildRecordSoFar(30, covenant, memories);
    }
    if (covenantAgeDays >= 90 && covenantAgeDays < 94) {
      return buildRecordSoFar(90, covenant, memories);
    }
  }

  // 5. Documentary — 21+ days, 5+ covenant-linked memories
  if (!shown.has('the_documentary') && covenantAgeDays >= 21) {
    const linked = memories.filter((m) => m.linkedPromiseId === covenant.id && m.type !== 'promise');
    if (linked.length >= 5) {
      return buildDocumentary(covenant, memories);
    }
  }

  // 6. Person becoming — 2+ defining/foundational memories
  if (!shown.has('the_person_youre_becoming')) {
    const defining = memories.filter(
      (m) =>
        m.isFoundational ||
        (m.emotionalWeight >= 0.85 && m.linkedPromiseId && m.type !== 'promise'),
    );
    if (defining.length >= 2) {
      return buildPersonBecoming(covenant, memories);
    }
  }

  return null;
}
