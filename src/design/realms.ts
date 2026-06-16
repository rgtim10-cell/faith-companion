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
    bg: '#04050A',
    accent: '#4D8CFF',
    accentSoft: '#7CA8FF',
    accentMuted: 'rgba(77,140,255,0.15)',
    gradientColors: ['rgba(77,140,255,0.18)', 'rgba(77,140,255,0.06)', 'rgba(4,5,10,0)'],
    orbColors: ['#BFD9FF', '#6FA3FF', '#2F66D9', '#142C66'],
    aiTone: 'Warm. Direct. Knowing.',
    insightPrefix: 'OATH senses',
  },
  future_self: {
    key: 'future_self',
    name: 'Future Self',
    tagline: 'I am becoming someone.',
    feeling: 'Evolving. Transforming. Becoming.',
    bg: '#050412',
    accent: '#8B5CF6',
    accentSoft: '#A78BFA',
    accentMuted: 'rgba(139,92,246,0.15)',
    gradientColors: ['rgba(139,92,246,0.2)', 'rgba(109,40,217,0.08)', 'rgba(5,4,18,0)'],
    orbColors: ['#DDD6FE', '#A78BFA', '#6D28D9', '#2E1065'],
    aiTone: 'Visionary. Expansive. Future-focused.',
    insightPrefix: 'OATH sees',
  },
  mission_control: {
    key: 'mission_control',
    name: 'Mission Control',
    tagline: 'I am operating at my highest level.',
    feeling: 'Sharp. Precise. In command.',
    bg: '#020810',
    accent: '#38BDF8',
    accentSoft: '#7DD3FC',
    accentMuted: 'rgba(56,189,248,0.14)',
    gradientColors: ['rgba(56,189,248,0.18)', 'rgba(14,165,233,0.07)', 'rgba(2,8,16,0)'],
    orbColors: ['#E0F2FE', '#7DD3FC', '#0284C7', '#082F49'],
    aiTone: 'Precise. Tactical. Execution-focused.',
    insightPrefix: 'OATH calculates',
  },
  alignment: {
    key: 'alignment',
    name: 'Alignment',
    tagline: 'I know what matters.',
    feeling: 'Calm. Clear. Grounded.',
    bg: '#020A08',
    accent: '#2DD4BF',
    accentSoft: '#5EEAD4',
    accentMuted: 'rgba(45,212,191,0.13)',
    gradientColors: ['rgba(45,212,191,0.16)', 'rgba(13,148,136,0.07)', 'rgba(2,10,8,0)'],
    orbColors: ['#CCFBF1', '#5EEAD4', '#0D9488', '#042F2E'],
    aiTone: 'Reflective. Grounding. Essential.',
    insightPrefix: 'OATH reflects',
  },
};

export const defaultRealm: RealmKey = 'presence';
