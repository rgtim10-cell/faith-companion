// Rule-based OATH interpretation engine.
// Given what the user did + what they think it proves,
// returns an OATH-voice "this proves that..." statement.

const PATTERNS: Array<{ test: RegExp; result: string }> = [
  {
    test: /client|deal|signed|sale|sold|contract|revenue|customer|closed/i,
    result: 'that you can close when it matters. The work is real.',
  },
  {
    test: /workout|gym|exercise|run|lift|train|physical|body|push.?up|miles?/i,
    result: 'that your body and your word are now the same thing.',
  },
  {
    test: /consistent|streak|\d+\s*days|habit|routine|kept going|showed up|morning ritual/i,
    result: 'that you are becoming someone who keeps their word — even when no one is watching.',
  },
  {
    test: /hard conversation|confrontation|honest|difficult conversation|uncomfortable|told the truth|spoke up/i,
    result: 'that you choose truth over comfort. That is rare.',
  },
  {
    test: /finished|completed|done|shipped|launched|delivered|published/i,
    result: 'that you finish what you start. Not everyone does.',
  },
  {
    test: /first time|first client|first|never before|never done/i,
    result: "that the version of you who said \"I can't\" was wrong.",
  },
  {
    test: /helped|supported|showed up for someone|gave|served|cared for/i,
    result: 'that you show up for others. That is evidence of who you are, not just what you do.',
  },
  {
    test: /stopped|quit|cut out|removed|let go|walked away|said no|declined|set a boundary/i,
    result: 'that you can choose yourself over comfort. Most people never develop that.',
  },
  {
    test: /learned|figured out|understood|realized|discovered|figured/i,
    result: 'that you are still growing. Curiosity is a kind of commitment.',
  },
  {
    test: /fear|scared|nervous|anxious|worried|despite/i,
    result: 'that you act anyway. That is not the absence of fear — that is courage.',
  },
  {
    test: /family|relationship|partner|friend|love|cared for someone/i,
    result: 'that you know what matters. And that you act on it.',
  },
  {
    test: /milestone|goal|target|record|personal best|\bpr\b/i,
    result: 'that you are building a record that speaks louder than your doubts.',
  },
  {
    test: /woke up|early|before everyone|5am|6am/i,
    result: 'that your defaults are changing. You are different now than when you started.',
  },
  {
    test: /kept going|didn.t stop|didn.t quit|pushed through|persisted/i,
    result: 'that persistence is now part of how you operate — not something you summon. Something you are.',
  },
];

export function interpretEvidence(what: string, proof: string): string {
  const combined = `${what} ${proof}`;
  for (const { test, result } of PATTERNS) {
    if (test.test(combined)) return result;
  }
  return 'that you showed up for yourself when it would have been easier not to. That is the whole thing.';
}

export function estimateWeight(what: string, proof: string): number {
  const combined = `${what} ${proof}`.toLowerCase();
  let w = 0.6;
  if (/first|never before/.test(combined)) w += 0.2;
  if (/client|deal|signed|launched|shipped/.test(combined)) w += 0.15;
  if (/consistent|\d+ days|streak/.test(combined)) w += 0.1;
  if (/fear|scared|hard|difficult|courage/.test(combined)) w += 0.1;
  return Math.min(1, w);
}
