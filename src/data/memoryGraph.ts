import type { RealmKey } from '@/design/realms';

export type MemoryType =
  | 'promise'
  | 'evidence'
  | 'struggle'
  | 'breakthrough'
  | 'truth'
  | 'pattern'
  | 'reflection';

export type ManifestationType =
  | 'evidence'
  | 'truth'
  | 'confidence'
  | 'drift'
  | 'future_self'
  | 'memory'
  | 'learning'
  | 'chain'; // Evidence Chain — the full transformation arc

export type FeedbackReaction = 'resonated' | 'not_relevant' | 'more' | 'disagree';

export interface ManifestationFeedback {
  type: ManifestationType;
  reaction: FeedbackReaction;
  date: number;
}

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  date: number;
  emotionalWeight: number; // 0–1
  tags: string[];
  linkedPromiseId?: string;
  source: 'covenant' | 'communion' | 'evidence_upload' | 'night_reflection' | 'oath_observed';
  realm?: RealmKey;
  oathInterpretation?: string; // what OATH sees this evidence proves
  imageUri?: string;           // 'placeholder' or real URI for photo evidence
}

export interface Covenant {
  id: string;
  promise: string;
  createdAt: number;
}

export interface Manifestation {
  id: string;
  type: ManifestationType;
  opening: string;
  records: MemoryRecord[];
  prompts: string[];
  explanation: string;
}

export const memoryTypeLabel: Record<MemoryType, string> = {
  promise: 'Promise',
  evidence: 'Evidence',
  struggle: 'Struggle',
  breakthrough: 'Breakthrough',
  truth: 'Truth',
  pattern: 'Pattern',
  reflection: 'Reflection',
};

export const memoryTypeGlyph: Record<MemoryType, string> = {
  promise: '◈',
  evidence: '◆',
  struggle: '▽',
  breakthrough: '△',
  truth: '○',
  pattern: '◎',
  reflection: '◇',
};

export const memoryTypeColor: Record<MemoryType, string> = {
  promise: '#8B5CF6',
  evidence: '#34D399',
  struggle: '#F87171',
  breakthrough: '#FBBF24',
  truth: '#38BDF8',
  pattern: '#F472B6',
  reflection: '#A78BFA',
};

export const manifestationLabel: Record<ManifestationType, string> = {
  evidence: 'Evidence',
  truth: 'Truth',
  confidence: 'Confidence',
  drift: 'Drift',
  future_self: 'Future Self',
  memory: 'Memory',
  learning: 'Learning',
  chain: 'Evidence Chain',
};

export const manifestationColor: Record<ManifestationType, string> = {
  evidence: '#34D399',
  truth: '#38BDF8',
  confidence: '#8B5CF6',
  drift: '#F87171',
  future_self: '#4D8CFF',
  memory: '#FBBF24',
  learning: '#F472B6',
  chain: '#D4A853',
};
