/**
 * Identity Engine tests.
 * Run with:
 *   npm run test:engine:identity
 *
 * Tests cover the five scenarios requested: emerging strength, emerging struggle,
 * covenant alignment, identity drift, and identity reinforcement — across all
 * four demo user stages.
 */

import { buildIdentityProfile } from '@/engine/identityEngine';
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

// ─ Week 1: 7 days, 6 real memories (< 14-day threshold, minimal traits)
const week1Cov: Covenant = {
  id: 'w1_cov',
  promise: 'I want to be someone who shows up, even when it is hard.',
  createdAt: ago(7),
};

const week1Mems: MemoryRecord[] = [
  { id: 'w1_1', type: 'promise', title: 'Oath', content: 'I want to be someone who shows up, even when it is hard.', date: ago(7), emotionalWeight: 1, tags: ['identity', 'commitment'], source: 'covenant' },
  { id: 'w1_2', type: 'struggle', title: 'Hard morning', content: "Didn't want to. Did it anyway. Barely.", date: ago(6), emotionalWeight: 0.6, tags: ['resistance', 'discipline'], source: 'communion' },
  { id: 'w1_3', type: 'truth', title: 'First five minutes', content: 'The first five minutes are the hardest. Once I start, it gets easier.', date: ago(5), emotionalWeight: 0.7, tags: ['pattern', 'start', 'beginning'], source: 'communion' },
  { id: 'w1_4', type: 'breakthrough', title: 'Shifted', content: 'Made it through a full day without checking my phone first thing. Felt different.', date: ago(3), emotionalWeight: 0.8, tags: ['discipline', 'identity'], source: 'communion' },
  { id: 'w1_5', type: 'evidence', title: 'First win', content: 'Finished the project I had been avoiding for two weeks.', date: ago(2), emotionalWeight: 0.85, tags: ['proof', 'action'], source: 'evidence_upload' },
  { id: 'w1_6', type: 'reflection', title: 'Night', content: 'Slower day. Showed up at 60%. Still counts.', date: ago(1), emotionalWeight: 0.55, tags: ['self-compassion', 'night'], source: 'night_reflection' },
];

// ─ Month 1: 30 days, rich memories with consistency + resilience
const month1Cov: Covenant = {
  id: 'm1_cov',
  promise: 'I will become the kind of person who builds things that last.',
  createdAt: ago(30),
};

const month1Mems: MemoryRecord[] = [
  { id: 'm1_1', type: 'promise', title: 'Oath', content: 'I will become the kind of person who builds things that last.', date: ago(30), emotionalWeight: 1, tags: ['identity', 'commitment', 'becoming'], source: 'covenant' },
  { id: 'm1_2', type: 'struggle', title: 'Resistance', content: 'Almost quit on day three. The resistance was strong.', date: ago(27), emotionalWeight: 0.7, tags: ['resistance', 'beginning'], source: 'communion' },
  { id: 'm1_3', type: 'breakthrough', title: 'First client', content: 'Signed the first client. Proof that the work is real.', date: ago(24), emotionalWeight: 0.95, tags: ['milestone', 'proof', 'identity'], source: 'evidence_upload' },
  { id: 'm1_4', type: 'truth', title: 'Pattern', content: 'My best work happens in the first 90 minutes.', date: ago(22), emotionalWeight: 0.75, tags: ['pattern', 'focus', 'energy'], source: 'communion' },
  { id: 'm1_5', type: 'evidence', title: 'Pitch', content: 'Presented to three potential clients. Two interested. Showed up despite fear.', date: ago(20), emotionalWeight: 0.88, tags: ['proof', 'action', 'courage'], source: 'evidence_upload' },
  { id: 'm1_6', type: 'struggle', title: 'Three hard days', content: 'Three bad days in a row. Missed the morning block twice. Felt like it was unraveling.', date: ago(18), emotionalWeight: 0.65, tags: ['setback', 'resilience'], source: 'communion' },
  { id: 'm1_7', type: 'truth', title: 'After setback', content: "I won't let one miss define me. The return is what matters.", date: ago(17), emotionalWeight: 0.8, tags: ['resilience', 'return', 'identity'], source: 'communion' },
  { id: 'm1_8', type: 'breakthrough', title: 'Comeback', content: 'Six for six after the hard stretch. The strongest week yet.', date: ago(11), emotionalWeight: 0.9, tags: ['consistency', 'discipline', 'identity'], source: 'communion' },
  { id: 'm1_9', type: 'reflection', title: 'Night', content: 'Something shifted. The work feels less like discipline and more like who I am.', date: ago(9), emotionalWeight: 0.7, tags: ['identity', 'night', 'becoming'], source: 'night_reflection' },
  { id: 'm1_10', type: 'evidence', title: 'Second client', content: 'Two clients. The business is real. I am building something.', date: ago(6), emotionalWeight: 0.92, tags: ['proof', 'milestone', 'builder'], isFoundational: true, source: 'evidence_upload' },
  { id: 'm1_11', type: 'truth', title: 'Evening', content: '9 PM is when my resolve weakens. I need to protect that hour.', date: ago(4), emotionalWeight: 0.72, tags: ['pattern', 'energy', 'protection'], source: 'communion' },
  { id: 'm1_12', type: 'breakthrough', title: 'Morning rhythm', content: 'Ten days in a row. The discipline is becoming who I am.', date: ago(2), emotionalWeight: 0.85, tags: ['consistency', 'identity', 'discipline'], source: 'communion' },
];

// ─ Month 3: 90 days, clear identity signal across themes
const month3Cov: Covenant = {
  id: 'm3_cov',
  promise: 'I am building a life I can be proud of — one day, one decision at a time.',
  createdAt: ago(90),
};

const month3Mems: MemoryRecord[] = [
  { id: 'm3_1', type: 'promise', title: 'Oath', content: 'I am building a life I can be proud of — one day, one decision at a time.', date: ago(90), emotionalWeight: 1, tags: ['identity', 'commitment', 'becoming'], source: 'covenant', isFoundational: true },
  { id: 'm3_2', type: 'struggle', title: 'Week one', content: "Three days in and already wanted to quit. The discipline wasn't there yet.", date: ago(87), emotionalWeight: 0.6, tags: ['beginning', 'resistance'], source: 'communion' },
  { id: 'm3_3', type: 'breakthrough', title: 'Seven days', content: 'Seven days. Showed up every single one.', date: ago(83), emotionalWeight: 0.78, tags: ['consistency', 'milestone'], source: 'communion' },
  { id: 'm3_4', type: 'truth', title: 'Morning', content: 'I am better in the morning. Not just more productive — more myself.', date: ago(79), emotionalWeight: 0.72, tags: ['pattern', 'identity', 'energy'], source: 'communion' },
  { id: 'm3_5', type: 'evidence', title: 'Client', content: 'Signed a six-month contract. Real money. Real proof.', date: ago(72), emotionalWeight: 0.94, tags: ['proof', 'milestone', 'builder'], isFoundational: true, source: 'evidence_upload' },
  { id: 'm3_6', type: 'struggle', title: 'Doubt spiral', content: "Who am I to be doing this? Imposter thoughts hit hard tonight.", date: ago(65), emotionalWeight: 0.7, tags: ['doubt', 'imposter', 'self-doubt'], source: 'communion' },
  { id: 'm3_7', type: 'truth', title: 'Realized', content: 'The doubt is always loudest right before a breakthrough. I know this pattern now.', date: ago(60), emotionalWeight: 0.8, tags: ['pattern', 'clarity', 'mindset'], source: 'communion' },
  { id: 'm3_8', type: 'evidence', title: 'Presented', content: 'Presented to the board. Room was tough. I held the floor. Did not back down.', date: ago(55), emotionalWeight: 0.91, tags: ['courage', 'action', 'proof'], source: 'evidence_upload' },
  { id: 'm3_9', type: 'breakthrough', title: 'Month 2 summary', content: 'Most productive, most grounded, most connected to why I started.', date: ago(45), emotionalWeight: 0.88, tags: ['proof', 'builder', 'milestone'], source: 'communion' },
  { id: 'm3_10', type: 'struggle', title: 'Isolation', content: 'Have been pulling away from people. Working constantly. Disconnected.', date: ago(38), emotionalWeight: 0.65, tags: ['isolation', 'alone', 'disconnected'], source: 'communion' },
  { id: 'm3_11', type: 'truth', title: 'Pattern', content: 'I avoid things when I am afraid they will expose me as a fraud.', date: ago(30), emotionalWeight: 0.85, tags: ['pattern', 'clarity', 'fear'], source: 'communion' },
  { id: 'm3_12', type: 'evidence', title: 'Daily discipline', content: 'Showed up 21 days in a row. Again.', date: ago(22), emotionalWeight: 0.87, tags: ['consistency', 'discipline', 'proof'], source: 'communion' },
  { id: 'm3_13', type: 'breakthrough', title: 'Realized who I am', content: 'The discipline is not the goal. It is who I am becoming. I can feel it now.', date: ago(15), emotionalWeight: 0.93, tags: ['identity', 'discipline', 'consistency', 'becoming'], source: 'communion' },
  { id: 'm3_14', type: 'struggle', title: 'Hard week', content: 'Missed three days. Felt the pull to just stop.', date: ago(10), emotionalWeight: 0.6, tags: ['drift', 'inconsistency', 'setback'], source: 'communion' },
  { id: 'm3_15', type: 'breakthrough', title: 'Back', content: 'Came back after the hard week. Faster than before.', date: ago(7), emotionalWeight: 0.82, tags: ['resilience', 'return', 'comeback'], source: 'communion' },
];

// ─ Drift scenario: recent struggles, no recovery (aligned covenant keywords fading)
const driftCov: Covenant = {
  id: 'drift_cov',
  promise: 'I am committed to consistency and showing up every day.',
  createdAt: ago(60),
};

const driftMems: MemoryRecord[] = [
  { id: 'd1', type: 'promise', title: 'Oath', content: 'I am committed to consistency and showing up every day.', date: ago(60), emotionalWeight: 1, tags: ['commitment', 'consistency'], source: 'covenant' },
  { id: 'd2', type: 'evidence', title: 'Early win', content: 'Showed up every day for two weeks.', date: ago(55), emotionalWeight: 0.85, tags: ['consistency', 'discipline'], source: 'communion' },
  { id: 'd3', type: 'breakthrough', title: 'Month one', content: 'Strongest month of work I have ever had.', date: ago(45), emotionalWeight: 0.9, tags: ['consistency', 'proof', 'milestone'], source: 'communion' },
  { id: 'd4', type: 'evidence', title: 'On track', content: 'Three weeks of daily work. No missed days.', date: ago(35), emotionalWeight: 0.8, tags: ['consistency', 'daily', 'discipline'], source: 'communion' },
  // Recent: drift begins
  { id: 'd5', type: 'struggle', title: 'Drift starts', content: 'Missed the morning block. Again. This is the third time this week.', date: ago(18), emotionalWeight: 0.65, tags: ['drift', 'inconsistency', 'missed'], source: 'communion' },
  { id: 'd6', type: 'struggle', title: 'Off track', content: 'Not following through on what I said. Slipping.', date: ago(12), emotionalWeight: 0.7, tags: ['inconsistency', 'off track', 'drift'], source: 'communion' },
  { id: 'd7', type: 'struggle', title: 'Three bad weeks', content: 'Three weeks of inconsistency. Nothing like what I was doing before.', date: ago(6), emotionalWeight: 0.6, tags: ['inconsistency', 'drift', 'missed'], source: 'communion' },
  { id: 'd8', type: 'struggle', title: 'Can\'t restart', content: 'Keep trying to restart the morning routine. Keep failing.', date: ago(2), emotionalWeight: 0.72, tags: ['inconsistency', 'procrastination', 'avoidance'], source: 'communion' },
];

// ─ Reinforcement scenario: trait clearly growing over time
const reinforceCov: Covenant = {
  id: 'reinforce_cov',
  promise: 'I will face hard things instead of running from them.',
  createdAt: ago(90),
};

const reinforceMems: MemoryRecord[] = [
  { id: 'r1', type: 'promise', title: 'Oath', content: 'I will face hard things instead of running from them.', date: ago(90), emotionalWeight: 1, tags: ['courage', 'commitment'], source: 'covenant' },
  // Early: courage appears rarely
  { id: 'r2', type: 'breakthrough', title: 'First hard conversation', content: 'Had the conversation despite the fear. Did not run.', date: ago(85), emotionalWeight: 0.75, tags: ['courage', 'action'], source: 'communion' },
  { id: 'r3', type: 'struggle', title: 'Avoidance', content: 'Avoided the hard email for three days.', date: ago(75), emotionalWeight: 0.6, tags: ['avoidance', 'resistance'], source: 'communion' },
  { id: 'r4', type: 'evidence', title: 'Sent the email', content: 'Sent it despite the fear. The fear lied.', date: ago(72), emotionalWeight: 0.8, tags: ['courage', 'action'], source: 'communion' },
  // Middle: courage growing
  { id: 'r5', type: 'breakthrough', title: 'Board presentation', content: 'Held the floor despite a tough room. Did not back down.', date: ago(55), emotionalWeight: 0.88, tags: ['courage', 'bold', 'action'], source: 'communion' },
  { id: 'r6', type: 'evidence', title: 'Called out wrong', content: 'Said what needed to be said in the team meeting. No one else did.', date: ago(45), emotionalWeight: 0.82, tags: ['courage', 'decisive'], source: 'communion' },
  { id: 'r7', type: 'truth', title: 'I notice', content: 'I used to avoid hard conversations completely. Now I notice when I am about to, and I do them anyway.', date: ago(35), emotionalWeight: 0.85, tags: ['clarity', 'pattern', 'courage'], source: 'communion' },
  // Recent: courage now consistent and strengthening
  { id: 'r8', type: 'evidence', title: 'Hard feedback', content: 'Gave honest feedback despite the risk. The relationship is better for it.', date: ago(20), emotionalWeight: 0.87, tags: ['courage', 'action', 'honest'], source: 'communion' },
  { id: 'r9', type: 'breakthrough', title: 'Did not hesitate', content: 'For the first time, I did not hesitate. The courage is becoming automatic.', date: ago(12), emotionalWeight: 0.91, tags: ['courage', 'bold', 'decisive'], source: 'communion' },
  { id: 'r10', type: 'evidence', title: 'Leadership moment', content: 'Stepped up when no one else would. Showed up despite feeling underprepared.', date: ago(5), emotionalWeight: 0.89, tags: ['courage', 'action', 'leadership'], source: 'communion' },
];

// ── TEST SUITE ─────────────────────────────────────────────────────────────

section('Week 1 — too early for identity (mirrorLevel ≤ 2)');
{
  const profile = buildIdentityProfile(week1Cov, week1Mems);
  ok(profile.mirrorLevel <= 2, 'Week 1: mirror level ≤ 2 (insufficient span/evidence)');
  ok(profile.mirrorObservation === null, 'Week 1: no Level 3 mirror observation');
  // May have weak traits but nothing above Level 3 threshold
  const level3 = [...profile.strengths, ...profile.struggles].filter(
    (t) => t.confidence >= 0.50 && t.spanDays >= 30,
  );
  ok(level3.length === 0, 'Week 1: no traits meet Level 3 criteria');
}

section('Month 1 — emerging traits, covenant alignment');
{
  const profile = buildIdentityProfile(month1Cov, month1Mems);

  // Should detect consistency (multiple discipline/consistency tags + breakthroughs)
  const consistency = profile.strengths.find((t) => t.id === 'consistency');
  ok(!!consistency, 'Month 1: consistency trait detected');
  ok((consistency?.evidenceCount ?? 0) >= 3, 'Month 1: consistency has ≥ 3 evidence');

  // Should detect resilience (setback followed by return)
  const resilience = profile.strengths.find((t) => t.id === 'resilience');
  ok(!!resilience, 'Month 1: resilience trait detected');

  // Covenant alignment: builder covenant with evidence of building
  ok(profile.covenantAlignment.alignedIds.length >= 2, 'Month 1: ≥ 2 aligned memories');
  ok(profile.covenantAlignment.alignmentScore > 0, 'Month 1: positive alignment score');

  // Mirror level: 30 days but may not have Level 3 confidence yet
  ok(profile.mirrorLevel >= 1, 'Month 1: mirrorLevel computed');
}

section('Month 3 — stable strengths, emerging identity (mirrorLevel 3)');
{
  const profile = buildIdentityProfile(month3Cov, month3Mems);

  // Consistency should be strong (21-day streaks, multiple breakthroughs)
  const consistency = profile.strengths.find((t) => t.id === 'consistency');
  ok(!!consistency, 'Month 3: consistency detected');
  ok((consistency?.confidence ?? 0) >= 0.30, 'Month 3: consistency confidence ≥ 0.30');

  // Self-awareness: multiple truth/pattern records across 90 days
  const selfAwareness = profile.strengths.find((t) => t.id === 'self_awareness');
  ok(!!selfAwareness, 'Month 3: self_awareness detected');

  // Self-doubt: 3 months has explicit doubt memories
  const doubt = profile.struggles.find((t) => t.id === 'self_doubt');
  ok(!!doubt, 'Month 3: self_doubt detected as struggle');

  // Should reach Level 3 with 90 days of data
  ok(profile.mirrorLevel === 3, 'Month 3: mirrorLevel === 3');
  ok(profile.mirrorObservation !== null, 'Month 3: mirror observation generated');
  ok(!profile.mirrorObservation?.includes('You are'), 'Month 3: observation is not declarative');
  ok(
    profile.mirrorObservation?.includes('OATH') ?? false,
    'Month 3: observation uses OATH voice',
  );

  // Covenant alignment
  ok(profile.covenantAlignment.alignedIds.length >= 3, 'Month 3: ≥ 3 aligned covenant memories');
}

section('Identity drift — recent drift from consistent start');
{
  const profile = buildIdentityProfile(driftCov, driftMems);

  // Inconsistency struggle should be detected (4 recent struggle memories with drift tags)
  const inconsistency = profile.struggles.find((t) => t.id === 'inconsistency');
  ok(!!inconsistency, 'Drift: inconsistency detected as struggle');
  ok((inconsistency?.trajectory ?? '') === 'strengthening' || (inconsistency?.trajectory ?? '') === 'emerging',
    'Drift: inconsistency trajectory shows it is growing recently');

  // Covenant alignment should show drifting trend
  ok(profile.covenantAlignment.recentTrend === 'drifting', 'Drift: covenantAlignment.recentTrend === drifting');

  // The drift observation should reference the gap
  ok(
    profile.covenantAlignment.oathObservation.includes('drift') ||
    profile.covenantAlignment.oathObservation.includes('gap'),
    'Drift: covenant observation describes the gap',
  );
}

section('Identity reinforcement — courage growing over 90 days');
{
  const profile = buildIdentityProfile(reinforceCov, reinforceMems);

  // Courage should be the dominant strength
  const courage = profile.strengths.find((t) => t.id === 'courage');
  ok(!!courage, 'Reinforcement: courage detected');
  ok((courage?.evidenceCount ?? 0) >= 5, 'Reinforcement: courage has ≥ 5 evidence points');
  ok((courage?.trajectory ?? '') === 'strengthening', 'Reinforcement: courage trajectory = strengthening');
  ok((courage?.confidence ?? 0) >= 0.40, 'Reinforcement: courage confidence ≥ 0.40');

  // Should reach Level 3
  ok(profile.mirrorLevel === 3, 'Reinforcement: mirrorLevel === 3');
  ok(profile.mirrorObservation !== null, 'Reinforcement: mirror observation generated');

  // The observation must reference the evidence count or growth
  const obs = profile.mirrorObservation ?? '';
  ok(
    obs.includes('OATH') && (obs.includes('record') || obs.includes('appears') || obs.includes('noticed')),
    'Reinforcement: observation is observational, references record',
  );

  // Should be the dominant strength
  ok(profile.dominantStrength?.id === 'courage' || (profile.dominantStrength?.confidence ?? 0) > 0,
    'Reinforcement: dominant strength detected');
}

section('Safeguard: no identity claims from thin evidence');
{
  // Only 2 memories — should not surface any trait
  const thinMems: MemoryRecord[] = [
    { id: 'thin_1', type: 'promise', title: 'Oath', content: 'Be disciplined.', date: ago(5), emotionalWeight: 1, tags: ['discipline'], source: 'covenant' },
    { id: 'thin_2', type: 'evidence', title: 'One day', content: 'Showed up today. Discipline working.', date: ago(2), emotionalWeight: 0.7, tags: ['discipline', 'consistency'], source: 'communion' },
  ];
  const profile = buildIdentityProfile(
    { id: 'thin_cov', promise: 'Be disciplined.', createdAt: ago(5) },
    thinMems,
  );
  ok(profile.strengths.length === 0, 'Safeguard: no strengths from 1 real memory');
  ok(profile.mirrorLevel === 1, 'Safeguard: mirrorLevel === 1 (insufficient data)');
  ok(profile.mirrorObservation === null, 'Safeguard: no observation from thin evidence');
}

section('OATH voice: observational language enforced');
{
  const profile = buildIdentityProfile(month3Cov, month3Mems);
  const allObservations = [
    ...profile.strengths.map((t) => t.oathObservation),
    ...profile.struggles.map((t) => t.oathObservation),
    profile.covenantAlignment.oathObservation,
    profile.mirrorObservation ?? '',
  ].filter(Boolean);

  // No observation should start with "You are"
  const declarative = allObservations.filter((o) => /^you are\b/i.test(o));
  ok(declarative.length === 0, 'Voice: no observation starts with "You are"');

  // Every trait observation should contain "OATH" or "the record" or "pattern"
  const observational = allObservations.filter(
    (o) => o.includes('OATH') || o.includes('record') || o.includes('pattern') || o.includes('appears'),
  );
  ok(observational.length === allObservations.length, 'Voice: all observations are from the record');
}

section('EvidenceIds: every trait is traceable');
{
  const profile = buildIdentityProfile(month3Cov, month3Mems);
  const allMemIds = new Set(month3Mems.map((m) => m.id));
  for (const trait of [...profile.strengths, ...profile.struggles]) {
    const allTraceable = trait.evidenceIds.every((id) => allMemIds.has(id));
    ok(allTraceable, `Traceable: ${trait.id} evidence IDs all exist in the memory graph`);
  }
}

// ── Phase 7: Identity Safety ───────────────────────────────────────────────

section('Phase 7: Challenge penalty reduces confidence by 0.70×');
{
  const baseline = buildIdentityProfile(month3Cov, month3Mems);
  const challenged = buildIdentityProfile(month3Cov, month3Mems, { challengedTraitIds: ['consistency'] });

  const baseConsistency = baseline.strengths.find((t) => t.id === 'consistency');
  const challConsistency = challenged.strengths.find((t) => t.id === 'consistency');

  ok(!!baseConsistency, 'Challenge: baseline has consistency trait');
  if (baseConsistency && challConsistency) {
    const ratio = challConsistency.confidence / baseConsistency.confidence;
    ok(Math.abs(ratio - 0.70) < 0.01, `Challenge: confidence ratio ≈ 0.70× (got ${ratio.toFixed(3)})`);
  } else if (baseConsistency && !challConsistency) {
    // Trait fell below surface threshold after penalty — valid outcome
    ok(true, 'Challenge: consistency dropped below surface threshold after 0.70× penalty');
  } else {
    ok(false, 'Challenge: unexpected state — baseline consistency missing');
  }
}

section('Phase 7: Suppression removes trait entirely');
{
  const baseline = buildIdentityProfile(month3Cov, month3Mems);
  const suppressed = buildIdentityProfile(month3Cov, month3Mems, { suppressedTraitIds: ['consistency'] });

  const baseHas = !!baseline.strengths.find((t) => t.id === 'consistency');
  ok(baseHas, 'Suppression: baseline has consistency trait');
  ok(!suppressed.strengths.find((t) => t.id === 'consistency'), 'Suppression: consistency absent from strengths');
  ok(!suppressed.struggles.find((t) => t.id === 'consistency'), 'Suppression: consistency absent from struggles');
}

section('Phase 7: Confidence language tiers');
{
  // HIGH (≥ 0.60): reinforcement scenario — courage has high evidence density
  const highProfile = buildIdentityProfile(reinforceCov, reinforceMems);
  const courageTrait = highProfile.strengths.find((t) => t.id === 'courage');
  ok(!!courageTrait, 'Confidence tiers: courage detected in reinforcement scenario');
  if (courageTrait) {
    ok(courageTrait.confidence >= 0.60, `Confidence tiers: courage is HIGH (${courageTrait.confidence.toFixed(3)} ≥ 0.60)`);
    ok(
      courageTrait.oathObservation.startsWith('This pattern has become difficult to ignore.'),
      `Confidence tiers: HIGH → "This pattern has become difficult to ignore."`,
    );
  }

  // MEDIUM ([0.42, 0.60)): find a trait in that range from month3
  const medProfile = buildIdentityProfile(month3Cov, month3Mems);
  const medTrait = [...medProfile.strengths, ...medProfile.struggles].find(
    (t) => t.confidence >= 0.42 && t.confidence < 0.60,
  );
  if (medTrait) {
    ok(
      medTrait.oathObservation.startsWith('OATH has noticed something.'),
      `Confidence tiers: MEDIUM → "OATH has noticed something." (${medTrait.id} = ${medTrait.confidence.toFixed(3)})`,
    );
  } else {
    ok(false, 'Confidence tiers: no MEDIUM-confidence trait found in month3 scenario');
  }

  // LOW (< 0.42): find a trait below the medium boundary
  const lowProfile = buildIdentityProfile(month1Cov, month1Mems);
  const lowTrait = [...lowProfile.strengths, ...lowProfile.struggles].find(
    (t) => t.confidence < 0.42,
  );
  if (lowTrait) {
    ok(
      lowTrait.oathObservation.startsWith('The record may be suggesting something.'),
      `Confidence tiers: LOW → "The record may be suggesting something." (${lowTrait.id} = ${lowTrait.confidence.toFixed(3)})`,
    );
  } else {
    ok(false, 'Confidence tiers: no LOW-confidence trait found in month1 scenario');
  }
}

section('Phase 7: No "you are" phrasing across all tiers');
{
  const profiles = [
    buildIdentityProfile(week1Cov, week1Mems),
    buildIdentityProfile(month1Cov, month1Mems),
    buildIdentityProfile(month3Cov, month3Mems),
    buildIdentityProfile(reinforceCov, reinforceMems),
  ];
  for (const p of profiles) {
    const allObs = [
      ...p.strengths.map((t) => t.oathObservation),
      ...p.struggles.map((t) => t.oathObservation),
      p.covenantAlignment.oathObservation,
      p.mirrorObservation ?? '',
    ].filter(Boolean);
    const hasYouAre = allObs.some((o) => /\byou are\b/i.test(o));
    ok(!hasYouAre, `Voice: no "you are" in profile with ${p.strengths.length + p.struggles.length} traits`);
  }
}

// ── Done ───────────────────────────────────────────────────────────────────

console.log('\n──────────────────────────────');
if (process.exitCode === 1) {
  console.log('Some tests FAILED.');
} else {
  console.log('All tests passed.');
}
