export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_premium: boolean;
  prayer_streak: number;
  longest_streak: number;
  total_prayers: number;
  created_at: string;
  updated_at: string;
}

export type PrayerCategory =
  | 'gratitude'
  | 'petition'
  | 'intercession'
  | 'confession'
  | 'praise'
  | 'healing'
  | 'guidance'
  | 'protection'
  | 'thanksgiving'
  | 'other';

export type PrayerStatus = 'active' | 'answered' | 'archived';

export interface Prayer {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: PrayerCategory;
  status: PrayerStatus;
  is_favorite: boolean;
  answered_at: string | null;
  answered_note: string | null;
  voice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerReflection {
  id: string;
  prayer_id: string;
  content: string;
  created_at: string;
}

export interface Devotional {
  id: string;
  user_id: string;
  title: string;
  content: string;
  scripture_reference: string;
  scripture_text: string;
  reflection_prompt: string;
  prayer_suggestion: string;
  mood_tag: MoodType | null;
  is_read: boolean;
  created_at: string;
}

export type MoodType =
  | 'peaceful'
  | 'grateful'
  | 'anxious'
  | 'hopeful'
  | 'joyful'
  | 'sorrowful'
  | 'stressed'
  | 'encouraged'
  | 'lonely'
  | 'content';

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: MoodType;
  intensity: number;
  note: string | null;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface DailyVerse {
  reference: string;
  text: string;
  date: string;
}

export interface PrayerReminder {
  id: string;
  user_id: string;
  title: string;
  time: string;
  days: number[];
  is_active: boolean;
  created_at: string;
}

export interface StreakData {
  current: number;
  longest: number;
  total_prayers: number;
  this_week: number;
  this_month: number;
}

export interface ProgressStats {
  streak: StreakData;
  mood_history: MoodEntry[];
  prayer_categories: Record<PrayerCategory, number>;
  answered_count: number;
  total_count: number;
}
