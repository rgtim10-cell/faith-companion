/**
 * Guidance Engine — retrieval pipeline tests.
 *
 * Run with:
 *   ts-node -P tsconfig.json -r tsconfig-paths/register src/engine/__tests__/guidanceEngine.test.ts
 * (tsconfig-paths resolves the @/ alias used by the engine imports)
 */

import { parseUtterance, retrieveForGuidance } from '@/engine/guidanceEngine';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';

// ── Helpers ────────────────────────────────────────────────────────────────

function ok(condition: boolean, label: string): void {
  if (!condition) {
    console.error(`  FAIL  ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  pass  ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const now = Date.now();
const ago = (days: number) => now - days * 24 * 60 * 60 * 1000;

const covenant: Covenant = {
  id: 'test_cov_1',
  promise: 'I will become the kind of person who builds things that last.',
  createdAt: ago(90),
};

const memories: MemoryRecord[] = [
  {
    id: 'm_struggle_1',
    type: 'struggle',
    title: 'Lost motivation',
    content: "Can't find the energy to keep going. Everything feels like resistance.",
    date: ago(60),
    emotionalWeight: 0.75,
    tags: ['resistance', 'discipline', 'energy'],
    linkedPromiseId: 'test_cov_1',
    source: 'communion',
  },
  {
    id: 'm_breakthrough_1',
    type: 'breakthrough',
    title: 'Shipped v1',
    content: 'Released the first version. People actually used it.',
    date: ago(45),
    emotionalWeight: 0.9,
    tags: ['builder', 'milestone', 'proof', 'resistance'],
    linkedPromiseId: 'test_cov_1',
    source: 'communion',
  },
  {
    id: 'm_evidence_1',
    type: 'evidence',
    title: 'Daily streak',
    content: 'Showed up 14 days in a row. Did not miss once.',
    date: ago(20),
    emotionalWeight: 0.8,
    tags: ['discipline', 'consistency', 'habit'],
    linkedPromiseId: 'test_cov_1',
    source: 'communion',
  },
  {
    id: 'm_truth_1',
    type: 'truth',
    title: 'What fear looks like',
    content: 'I avoid things when I am afraid they will expose me as a fraud.',
    date: ago(30),
    emotionalWeight: 0.85,
    tags: ['identity', 'pattern', 'clarity', 'fear'],
    source: 'communion',
  },
  {
    id: 'm_pattern_1',
    type: 'pattern',
    title: 'The 3am doubt loop',
    content: 'Every time something matters, I spiral at night and talk myself out of it by morning.',
    date: ago(14),
    emotionalWeight: 0.7,
    tags: ['pattern', 'mindset', 'night', 'resistance'],
    source: 'communion',
  },
  {
    id: 'm_reflection_1',
    type: 'reflection',
    title: 'Family first',
    content: 'When I am at my best, my family can feel it. The work and the love are not separate.',
    date: ago(7),
    emotionalWeight: 0.78,
    tags: ['family', 'love', 'connection', 'becoming'],
    source: 'communion',
  },
  {
    id: 'm_struggle_2',
    type: 'struggle',
    title: 'Discipline gap',
    content: 'Missed a week of workouts. Feel like I am sliding.',
    date: ago(40),
    emotionalWeight: 0.65,
    tags: ['discipline', 'consistency', 'health', 'fitness'],
    source: 'communion',
  },
];

// ── parseUtterance tests ────────────────────────────────────────────────────

section('parseUtterance — intent classification');
{
  const r = parseUtterance("I'm really struggling and I can't keep going.", memories);
  ok(r.intent === 'vent', 'distress without question → vent');
  ok(r.emotional === 'distress', 'emotional signal = distress');
}
{
  const r = parseUtterance("Should I take the new job or stay where I am?", memories);
  ok(r.intent === 'decide', 'question with choice → decide');
}
{
  const r = parseUtterance("I said I would work out every day this month.", memories);
  ok(r.intent === 'seek_accountability', 'commitment check-in → seek_accountability');
}
{
  const r = parseUtterance("I finally did it — shipped the product today.", memories);
  ok(r.intent === 'celebrate', 'celebration words → celebrate');
  ok(r.emotional === 'hope', 'celebration emotional = hope');
}
{
  const r = parseUtterance("Just thinking about where I am right now.", memories);
  ok(r.intent === 'reflect', 'no strong signal → reflect');
}

section('parseUtterance — theme tag extraction');
{
  const r = parseUtterance("My discipline and consistency have been slipping.", memories);
  ok(r.themeTags.includes('discipline'), 'extracts discipline theme tag');
  ok(r.themeTags.includes('consistency'), 'extracts consistency theme tag');
}
{
  const r = parseUtterance("I want to honour my word and my covenant.", memories);
  ok(r.invokesCovenant, 'detects covenant invocation via "covenant"');
}
{
  const r = parseUtterance("I want to honour my oath and keep my promise.", memories);
  ok(r.invokesCovenant, 'detects covenant invocation via "promise" / "oath"');
}

section('parseUtterance — direct tag matching');
{
  const r = parseUtterance("dealing with resistance every morning", memories);
  ok(r.directTags.includes('resistance'), 'matches personal tag "resistance" from memory graph');
}

// ── retrieveForGuidance tests ───────────────────────────────────────────────

section('retrieveForGuidance — distress / emotional twin');
{
  const r = retrieveForGuidance(
    "I can't find the energy. I feel like giving up on everything.",
    covenant,
    memories,
  );
  ok(r.hasMemory, 'distress utterance surfaces at least one memory');
  ok(r.emotional === 'distress', 'emotional signal propagated');
  ok(r.intent === 'vent', 'intent = vent');
  // The struggle+breakthrough arc should score highly
  const ids = r.ranked.map((rr) => rr.memory.id);
  ok(
    ids.includes('m_struggle_1') || ids.includes('m_breakthrough_1'),
    'surfaces struggle or breakthrough in distress scenario',
  );
  const hasTwin = r.ranked.some((rr) => rr.link === 'emotional_twin');
  ok(hasTwin, 'emotional twin link detected when struggle followed by breakthrough');
  ok(r.recall.length > 0, 'recall line generated');
  ok(r.connect.length > 0, 'connect line generated');
  ok(r.question.length > 0, 'question line generated');
}

section('retrieveForGuidance — celebration');
{
  const r = retrieveForGuidance(
    "I finally did it. Hit the milestone. Shipped the app.",
    covenant,
    memories,
  );
  ok(r.hasMemory, 'celebration utterance surfaces memories');
  ok(r.intent === 'celebrate', 'intent = celebrate');
  const hasEvidence = r.ranked.some(
    (rr) => rr.memory.type === 'evidence' || rr.memory.type === 'breakthrough',
  );
  ok(hasEvidence, 'surfaces evidence/breakthrough in celebration scenario');
}

section('retrieveForGuidance — decision');
{
  const r = retrieveForGuidance(
    "Should I quit my job and go full-time on this, or stay safe?",
    covenant,
    memories,
  );
  ok(r.hasMemory, 'decision utterance surfaces memories');
  ok(r.intent === 'decide', 'intent = decide');
  ok(r.question.includes('covenant') || r.question.length > 10, 'question references covenant or is substantive');
}

section('retrieveForGuidance — accountability');
{
  const r = retrieveForGuidance(
    "I committed to working out every day and I missed a week.",
    covenant,
    memories,
  );
  ok(r.hasMemory, 'accountability utterance surfaces memories');
  ok(r.intent === 'seek_accountability', 'intent = seek_accountability');
}

section('retrieveForGuidance — covenant invocation');
{
  const r = retrieveForGuidance(
    "I keep thinking about my promise and what I said I would become.",
    covenant,
    memories,
  );
  // The covenant record should be injected at top
  ok(r.ranked.length > 0, 'covenant invocation surfaces records');
  const hasCovenantRecord = r.ranked.some((rr) => rr.link === 'covenant');
  ok(hasCovenantRecord, 'covenant record appears when covenant is invoked');
}

section('retrieveForGuidance — honest fallback');
{
  const emptyCovenant: Covenant = {
    id: 'empty_cov',
    promise: 'Testing',
    createdAt: Date.now(),
  };
  const r = retrieveForGuidance(
    "I'm wondering about something completely unrelated.",
    emptyCovenant,
    [], // no memories
  );
  ok(!r.hasMemory, 'no memories → honest fallback');
  ok(r.ranked.length === 0, 'ranked is empty on fallback');
  ok(r.connect.includes("OATH doesn't have"), 'fallback connect line is honest');
  ok(r.question.includes('remember'), 'fallback question invites first memory');
}

section('retrieveForGuidance — ranking order');
{
  const r = retrieveForGuidance(
    "My discipline is slipping. I used to be consistent.",
    covenant,
    memories,
  );
  ok(r.hasMemory, 'surfaces memories for discipline topic');
  ok(r.ranked.length <= 3, 'at most 3 memories returned');
  // Verify scores are descending
  for (let i = 1; i < r.ranked.length; i++) {
    ok(r.ranked[i - 1].score >= r.ranked[i].score, `ranked[${i - 1}] score ≥ ranked[${i}] score`);
  }
}

section('retrieveForGuidance — resonance groups');
{
  const r = retrieveForGuidance("I keep hitting the same wall.", covenant, memories);
  ok(r.resonance.length >= 0, 'resonance array present (may be empty for small sets)');
}

// ── Done ───────────────────────────────────────────────────────────────────

console.log('\n──────────────────────────────');
if (process.exitCode === 1) {
  console.log('Some tests FAILED.');
} else {
  console.log('All tests passed.');
}
