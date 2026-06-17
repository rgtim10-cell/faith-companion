export type RealmKey = 'presence' | 'future_self' | 'mission_control' | 'alignment';

export interface RealmConfig {
  key: RealmKey;
  name: string;
  tagline: string;
  feeling: string;
  bg: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  gradientColors: [string, string, string];
  orbColors: [string, string, string, string];
  aiTone: string;
  insightPrefix: string;
}

export const realms: Record<RealmKey, RealmConfig> = {
  presence: {
    key: 'presence',
    name: 'Presence',
    tagline: 'Something intelligent is with me.',
    feeling: 'Understood. Supported. Not alone.',
    bg: '#030408',
    accent: '#4D8CFF',
    accentSoft: '#7CA8FF',
    accentMuted: 'rgba(77,140,255,0.12)',
    gradientColors: ['rgba(77,140,255,0.22)', 'rgba(77,140,255,0.07)', 'rgba(3,4,8,0)'],
    // Dark void center → deep dark → mid blue → edge bright
    orbColors: ['#010308', '#04112A', '#163272', '#4D8CFF'],
    aiTone: 'Warm. Direct. Knowing.',
    insightPrefix: 'OATH senses',
  },
  future_self: {
    key: 'future_self',
    name: 'Future Self',
    tagline: 'I am becoming someone.',
    feeling: 'Evolving. Transforming. Becoming.',
    bg: '#040211',
    accent: '#8B5CF6',
    accentSoft: '#A78BFA',
    accentMuted: 'rgba(139,92,246,0.12)',
    gradientColors: ['rgba(139,92,246,0.24)', 'rgba(109,40,217,0.08)', 'rgba(4,2,17,0)'],
    orbColors: ['#030114', '#0D052E', '#3B157A', '#8B5CF6'],
    aiTone: 'Visionary. Expansive. Future-focused.',
    insightPrefix: 'OATH sees',
  },
  mission_control: {
    key: 'mission_control',
    name: 'Mission Control',
    tagline: 'I am operating at my highest level.',
    feeling: 'Sharp. Precise. In command.',
    bg: '#010710',
    accent: '#38BDF8',
    accentSoft: '#7DD3FC',
    accentMuted: 'rgba(56,189,248,0.12)',
    gradientColors: ['rgba(56,189,248,0.2)', 'rgba(14,165,233,0.07)', 'rgba(1,7,16,0)'],
    orbColors: ['#000810', '#031828', '#074E7A', '#38BDF8'],
    aiTone: 'Precise. Tactical. Execution-focused.',
    insightPrefix: 'OATH calculates',
  },
  alignment: {
    key: 'alignment',
    name: 'Alignment',
    tagline: 'I know what matters.',
    feeling: 'Calm. Clear. Grounded.',
    bg: '#010A07',
    accent: '#2DD4BF',
    accentSoft: '#5EEAD4',
    accentMuted: 'rgba(45,212,191,0.11)',
    gradientColors: ['rgba(45,212,191,0.18)', 'rgba(13,148,136,0.07)', 'rgba(1,10,7,0)'],
    orbColors: ['#000C09', '#011F17', '#054840', '#2DD4BF'],
    aiTone: 'Reflective. Grounding. Essential.',
    insightPrefix: 'OATH reflects',
  },
};

export const defaultRealm: RealmKey = 'presence';
