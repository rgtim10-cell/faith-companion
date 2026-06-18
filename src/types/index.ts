import type { RealmKey } from '@/design/realms';

export type { RealmKey };

export type MissionStatus = 'active' | 'completed' | 'locked';
export type MissionCategory = 'Focus' | 'Body' | 'Mind' | 'Discipline' | 'Spirit';
export type MoodLevel = 'low' | 'steady' | 'strong' | 'unstoppable';

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  status: MissionStatus;
  progress: number;
  estimatedMinutes: number;
}

export interface MomentumStat {
  id: string;
  label: string;
  value: number;
  trend: number;
}

export interface VaultMemory {
  id: string;
  daysAgo: number;
  quote: string;
  reflection: string;
  emotionalWeight: 'high' | 'medium';
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  preview: string;
  mood: MoodLevel;
}

export interface AIInsightData {
  screen: string;
  text: string;
}

export interface UserProfile {
  name: string;
  firstName: string;
  archetype: string;
  streak: number;
  level: number;
  oath: string;
  tagline: string;
}

// Navigation param lists
export type RootStackParamList = {
  Tabs: undefined;
  NightReflection: undefined;
  Communion: undefined;
  Theater: undefined;
  Intervention: undefined;
};

export type TabParamList = {
  Today: undefined;
  Evidence: undefined;
  Oath: undefined;
  Memory: undefined;
  Vault: undefined;
};
