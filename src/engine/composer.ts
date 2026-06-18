import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import type { ComposedExperience, ExperienceTrigger, ExperienceType } from './composerTypes';
import { TRIGGER_PRIORITY } from './composerTypes';

const DAY = 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────

function daysAgo(date: number): number {
  return Math.round((Date.now() - date) / DAY);
}

function excerpt(text: string, max = 90): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function covenantAsRecord(covenant: Covenant): MemoryRecord {
  return {
    id: `cov_record_${covenant.id}`,
    type: 'promise',
    title: 'Founding covenant',
    content: covenant.promise,
    date: covenant.createdAt,
    emotionalWeight: 1,
    tags: ['covenant'],
    source: 'covenant',
  };
}

// ── Experience builders ────────────────────────────────────────

function buildProofYouNeeded(
  covenant: Covenant | null,
  memories: MemoryRecord[],
): ComposedExperience | null {
  // Need: a doubt/struggle that predates a piece of evidence or breakthrough.
  const doubts = memories
    .filter((m) => m.type === 'struggle' || m.type === 'promise')
    .sort((a, b) => a.date - b.date);

  const proofs = memories
    .filter((m) => m.type === 'evidence' || m.type === 'breakthrough')
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight);

  if (doubts.length === 0 || proofs.length === 0) return null;

  const doubt = doubts[0];
  const proof = proofs.find((p) => p.date > doubt.date && p.id !== doubt.id);
  if (!proof) return null;

  const between = Math.round((proof.date - doubt.date) / DAY);
  const betweenStr = between === 1 ? '1 day later' : `${between} days later`;

  return {
    id: `exp_proof_${Date.now()}`,
    type: 'proof_you_needed',
    trigger: 'motivation',
    hook: `You were wrong about yourself.`,
    body: `You wrote this:\n\n"${excerpt(doubt.content)}"\n\n${betweenStr}:\n\n"${excerpt(proof.content)}"`,
    pivot: 'The doubt was real. So is this.',
    records: [doubt, proof],
    prompts: ["I don't see it yet", 'Connect this to now', 'What else do you see?'],
    composedAt: Date.now(),
  };
}

function buildSomethingChanged(
  covenant: Covenant | null,
  memories: MemoryRecord[],
): ComposedExperience | null {
  const now = Date.now();
  const recent = memories.filter((m) => m.date > now - 14 * DAY);
  const recentStruggles = recent.filter((m) => m.type === 'struggle');
  const recentWins = recent.filter((m) => m.type === 'breakthrough' || m.type === 'evidence');

  if (recentStruggles.length < 2) return null;

  const topStruggle = [...recentStruggles].sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  const bodyLines = [
    `${recentStruggles.length} struggles in the last 14 days.`,
    `${recentWins.length} breakthrough${recentWins.length !== 1 ? 's' : ''}.`,
  ];
  if (topStruggle) {
    bodyLines.push(`\n"${excerpt(topStruggle.content)}"`);
  }

  return {
    id: `exp_changed_${Date.now()}`,
    type: 'something_changed',
    trigger: 'drift',
    hook: 'Something has shifted.',
    body: bodyLines.join('\n'),
    pivot: 'What happened?',
    records: recentStruggles.slice(0, 3),
    prompts: ['I know what happened', "I'm not sure", 'Help me see it'],
    composedAt: Date.now(),
  };
}

function buildPatternICantIgnore(
  memories: MemoryRecord[],
): ComposedExperience | null {
  const counts: Partial<Record<string, number>> = {};
  memories.forEach((m) => {
    if (m.type !== 'promise') counts[m.type] = (counts[m.type] ?? 0) + 1;
  });

  const dominant = (Object.entries(counts) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (!dominant || dominant[1] < 3) return null;
  const [type, count] = dominant;

  const records = memories
    .filter((m) => m.type === type)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)
    .slice(0, 3);

  const verbMap: Record<string, string> = {
    breakthrough: `break through when you commit. OATH has seen this ${count} times.`,
    struggle: `face the same wall in different forms. OATH has counted ${count} encounters.`,
    reflection: `reflect more than you realize. OATH has kept ${count} reflections.`,
    evidence: `keep generating proof. OATH has ${count} entries in the record.`,
    truth: `surface realizations quickly. OATH has catalogued ${count}.`,
  };

  const verb = verbMap[type] ?? `return to this pattern. OATH has ${count} instances on record.`;
  const examples = records.slice(0, 2).map((r) => `"${excerpt(r.content)}"`).join('\n\n');

  return {
    id: `exp_pattern_${Date.now()}`,
    type: 'pattern_i_cant_ignore',
    trigger: 'show_me',
    hook: 'OATH cannot ignore this anymore.',
    body: `You ${verb}\n\n${examples}`,
    pivot: 'This is not a coincidence. This is who you are.',
    records,
    prompts: ["I hadn't noticed", 'Tell me more', "I disagree — this isn't a pattern"],
    composedAt: Date.now(),
  };
}

function buildPersonYouBecoming(
  covenant: Covenant | null,
  memories: MemoryRecord[],
): ComposedExperience | null {
  if (!covenant) return null;

  const linked = memories
    .filter((m) => m.linkedPromiseId === covenant.id)
    .sort((a, b) => a.date - b.date);

  if (linked.length < 2) return null;

  const types = new Set(linked.map((m) => m.type));
  if (types.size < 2) return null;

  const days = daysAgo(covenant.createdAt);
  const daysStr = days === 1 ? '1 day ago' : `${days} days ago`;

  // Build arc waypoints from the linked chain.
  const struggle = linked.find((m) => m.type === 'struggle');
  const breakthrough = linked.find((m) => m.type === 'breakthrough');
  const evidence = linked.find((m) => m.type === 'evidence');

  const arcParts: string[] = [];
  if (struggle) arcParts.push(`You struggled:\n"${excerpt(struggle.content)}"`);
  if (breakthrough) arcParts.push(`You broke through:\n"${excerpt(breakthrough.content)}"`);
  if (evidence) arcParts.push(`You proved it:\n"${excerpt(evidence.content)}"`);

  const body = arcParts.length > 0
    ? `${arcParts.join('\n\n')}`
    : `${linked.length} things have happened since. All of them are evidence.`;

  return {
    id: `exp_becoming_${Date.now()}`,
    type: 'person_you_becoming',
    trigger: 'auto',
    hook: `${daysStr}, you made a promise.\n\n"${excerpt(covenant.promise, 100)}"`,
    body,
    pivot: 'You are already that person. The record says so.',
    records: [covenantAsRecord(covenant), ...linked.slice(0, 3)],
    prompts: ["I can't see it yet", 'Show me the evidence', 'I want to go deeper'],
    composedAt: Date.now(),
  };
}

function buildSurpriseMe(
  covenant: Covenant | null,
  memories: MemoryRecord[],
): ComposedExperience | null {
  const now = Date.now();

  // Strategy A: old high-weight memory + recent echo (shared tag or linked promise).
  const old = [...memories]
    .filter((m) => m.date < now - 30 * DAY && m.emotionalWeight >= 0.7)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  const recent7 = memories.filter((m) => m.date > now - 7 * DAY);

  if (old && recent7.length > 0) {
    const echo = recent7.find(
      (r) => r.id !== old.id && (r.tags.some((t) => old.tags.includes(t)) || r.linkedPromiseId === old.linkedPromiseId),
    ) ?? recent7[0];

    const oldDays = daysAgo(old.date);
    const echoDays = daysAgo(echo.date);

    return {
      id: `exp_surprise_echo_${Date.now()}`,
      type: 'surprise_me',
      trigger: 'surprise',
      hook: `Something from ${oldDays} days ago just became relevant again.`,
      body: `"${excerpt(old.content)}"\n\n${echoDays === 0 ? 'Today' : echoDays === 1 ? 'Yesterday' : `${echoDays} days ago`}:\n\n"${excerpt(echo.content)}"`,
      pivot: 'OATH did not plan to show you this today. It surfaced anyway.',
      records: [old, echo],
      prompts: ['This still matters', "I've moved past this", "Tell me what you're seeing"],
      composedAt: Date.now(),
    };
  }

  // Strategy B: a truth paired with a recent struggle — surfaced as a response.
  const truth = [...memories]
    .filter((m) => m.type === 'truth' && m.emotionalWeight >= 0.6)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  const recentStruggle = [...memories]
    .filter((m) => m.type === 'struggle' && m.date > now - 14 * DAY)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  if (truth && recentStruggle) {
    return {
      id: `exp_surprise_truth_${Date.now()}`,
      type: 'surprise_me',
      trigger: 'surprise',
      hook: 'OATH found something you wrote that belongs to this moment.',
      body: `"${excerpt(truth.content, 120)}"\n\nYou wrote this ${daysAgo(truth.date)} days ago.\n\nThis is what it answers:\n\n"${excerpt(recentStruggle.content)}"`,
      pivot: 'You already knew what you needed to know.',
      records: [truth, recentStruggle],
      prompts: ['This still applies', "I've moved past this", 'Connect this to today'],
      composedAt: Date.now(),
    };
  }

  // Strategy C: single highest-weight memory, surfaced simply.
  const strongest = [...memories]
    .filter((m) => m.emotionalWeight >= 0.8)
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

  if (strongest) {
    const days = daysAgo(strongest.date);
    return {
      id: `exp_surprise_single_${Date.now()}`,
      type: 'surprise_me',
      trigger: 'surprise',
      hook: `OATH has been holding something from ${days} days ago.`,
      body: `"${excerpt(strongest.content, 140)}"`,
      pivot: 'Remember this.',
      records: [strongest],
      prompts: ['This still matters', "I've grown past this", 'Why are you showing me this?'],
      composedAt: Date.now(),
    };
  }

  return null;
}

// ── Main composer ──────────────────────────────────────────────

export function composeExperience(
  covenant: Covenant | null,
  memories: MemoryRecord[],
  trigger: ExperienceTrigger,
  recentTypes: ExperienceType[] = [],
): ComposedExperience | null {
  const preferred = TRIGGER_PRIORITY[trigger] ?? TRIGGER_PRIORITY.show_me;

  // Variety: deprioritize recently shown types without removing them.
  const ordered = [
    ...preferred.filter((t) => !recentTypes.includes(t)),
    ...preferred.filter((t) => recentTypes.includes(t)),
  ];

  for (const type of ordered) {
    let exp: ComposedExperience | null = null;

    switch (type) {
      case 'proof_you_needed':
        exp = buildProofYouNeeded(covenant, memories);
        break;
      case 'something_changed':
        exp = buildSomethingChanged(covenant, memories);
        break;
      case 'pattern_i_cant_ignore':
        exp = buildPatternICantIgnore(memories);
        break;
      case 'person_you_becoming':
        exp = buildPersonYouBecoming(covenant, memories);
        break;
      case 'surprise_me':
        exp = buildSurpriseMe(covenant, memories);
        break;
    }

    if (exp) return { ...exp, trigger };
  }

  return null;
}
