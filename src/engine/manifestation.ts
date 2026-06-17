import type { Covenant, Manifestation, MemoryRecord } from '@/data/memoryGraph';

const DAY = 24 * 60 * 60 * 1000;

function recentOf(memories: MemoryRecord[], type: MemoryRecord['type'], days: number): MemoryRecord[] {
  const cutoff = Date.now() - days * DAY;
  return memories.filter((m) => m.type === type && m.date >= cutoff);
}

function daysAgo(date: number): number {
  return Math.round((Date.now() - date) / DAY);
}

export function buildManifestations(covenant: Covenant | null, memories: MemoryRecord[]): Manifestation[] {
  const result: Manifestation[] = [];

  const evidences = memories.filter((m) => m.type === 'evidence');
  const promises = memories.filter((m) => m.type === 'promise');
  const breakthroughs = memories.filter((m) => m.type === 'breakthrough');
  const struggles = memories.filter((m) => m.type === 'struggle');
  const truths = memories.filter((m) => m.type === 'truth');
  const recentEvidence = recentOf(memories, 'evidence', 14);
  const recentBreakthroughs = recentOf(memories, 'breakthrough', 21);
  const recentStruggles = recentOf(memories, 'struggle', 14);

  // Evidence — recent proof of transformation
  if (evidences.length > 0) {
    const records = (recentEvidence.length > 0 ? recentEvidence : evidences).slice(0, 3);
    result.push({
      id: 'manifest_evidence',
      type: 'evidence',
      opening: covenant
        ? `You said you wanted to become someone you could be proud of.\nHere's proof you already are.`
        : "Here's proof of your transformation.",
      records,
      prompts: [
        'Connect this to my promise',
        'Show me more like this',
        'Why did you show me this?',
      ],
      explanation:
        'I surface evidence when you have kept your word without realizing it. These are not coincidences — they are you, becoming.',
    });
  }

  // Confidence — promises backed by evidence
  if (promises.length > 0 && breakthroughs.length + evidences.length > 0) {
    const count = breakthroughs.length + evidences.length;
    result.push({
      id: 'manifest_confidence',
      type: 'confidence',
      opening: `You have kept your word ${count} time${count !== 1 ? 's' : ''}.\nThat is not nothing.`,
      records: [...promises.slice(0, 1), ...[...evidences, ...breakthroughs].slice(0, 2)],
      prompts: ['I disagree', 'Show me the pattern', 'Why did you show me this?'],
      explanation:
        'I track the gap between what you promised and what you did. When the gap closes, I notice.',
    });
  }

  // Truth — realized insights
  if (truths.length > 0) {
    result.push({
      id: 'manifest_truth',
      type: 'truth',
      opening: `Something you realized.\nStill true.`,
      records: truths.slice(0, 1),
      prompts: ['This still applies', "I've moved past this", 'Why did you show me this?'],
      explanation:
        'Truths age differently than facts. I resurface them when I think you need the reminder — not when they are new, but when they are relevant.',
    });
  }

  // Drift — unresolved struggles
  if (recentStruggles.length > recentBreakthroughs.length && recentStruggles.length >= 2) {
    result.push({
      id: 'manifest_drift',
      type: 'drift',
      opening: `Something is pulling at you.\nI want to name it.`,
      records: recentStruggles.slice(0, 2),
      prompts: ["I'm aware of it", 'Help me understand this', 'Why did you show me this?'],
      explanation:
        'When I see patterns of struggle without corresponding breakthroughs, I name it — not to judge, but because naming drift is the first step out of it.',
    });
  }

  // Memory — most emotionally significant moment
  const significant = [...memories]
    .filter((m) => m.emotionalWeight >= 0.8)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight);
  if (significant.length > 0) {
    const record = significant[0];
    const d = daysAgo(record.date);
    result.push({
      id: 'manifest_memory',
      type: 'memory',
      opening: `${d} day${d !== 1 ? 's' : ''} ago, you said something.\nI have been keeping it.`,
      records: [record],
      prompts: ['This still matters', "I've grown past this", 'Why did you show me this?'],
      explanation:
        'I do not surface every memory. I surface the ones with the most emotional weight, at the moment I think you need them most.',
    });
  }

  // Learning — detected pattern
  const typeCounts: Partial<Record<MemoryRecord['type'], number>> = {};
  memories.forEach((m) => {
    typeCounts[m.type] = (typeCounts[m.type] ?? 0) + 1;
  });
  const dominantEntry = (Object.entries(typeCounts) as [MemoryRecord['type'], number][])
    .filter(([t]) => t !== 'promise')
    .sort((a, b) => b[1] - a[1])[0];
  if (dominantEntry && dominantEntry[1] >= 3) {
    const [dominantType, count] = dominantEntry;
    const patternOpening: Partial<Record<MemoryRecord['type'], string>> = {
      breakthrough: 'You tend to break through when you commit.\nI see it happening again and again.',
      struggle: 'You face the same wall in different forms.\nThat is not weakness — that is a teacher.',
      reflection: 'You reflect often.\nThat frequency is shaping who you are.',
      evidence: `You keep adding proof.\nThe archive is becoming undeniable.`,
      truth: 'You surface truths consistently.\nYour pattern of realization is a strength.',
    };
    result.push({
      id: 'manifest_learning',
      type: 'learning',
      opening: patternOpening[dominantType] ?? 'OATH has noticed something recurring.',
      records: memories.filter((m) => m.type === dominantType).slice(0, 3),
      prompts: ["I hadn't noticed that", 'Tell me more', 'Why did you show me this?'],
      explanation: `Patterns emerge when data accumulates. I detected this one from ${count} data points across your Memory Graph.`,
    });
  }

  // Future Self — always present as anchor
  result.push({
    id: 'manifest_future_self',
    type: 'future_self',
    opening: covenant
      ? `"${covenant.promise}"\n\nThe version of you who said this is already here.`
      : 'The version of you who started this is already changing.',
    records: [...breakthroughs, ...evidences].slice(0, 3),
    prompts: ["I can't see it yet", 'Show me the evidence', 'Why did you show me this?'],
    explanation:
      'I surface your Future Self when I want to remind you of the distance you have already traveled — not the distance remaining.',
  });

  return result;
}
