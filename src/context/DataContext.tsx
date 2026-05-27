import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { Prayer, PrayerCategory, PrayerStatus, Devotional, MoodEntry, MoodType, AIMessage, AIConversation } from '@/types';

interface DataState {
  prayers: Prayer[];
  devotionals: Devotional[];
  moods: MoodEntry[];
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
}

type DataAction =
  | { type: 'ADD_PRAYER'; prayer: Prayer }
  | { type: 'UPDATE_PRAYER'; id: string; updates: Partial<Prayer> }
  | { type: 'DELETE_PRAYER'; id: string }
  | { type: 'SET_PRAYERS'; prayers: Prayer[] }
  | { type: 'ADD_DEVOTIONAL'; devotional: Devotional }
  | { type: 'SET_DEVOTIONALS'; devotionals: Devotional[] }
  | { type: 'ADD_MOOD'; mood: MoodEntry }
  | { type: 'SET_MOODS'; moods: MoodEntry[] }
  | { type: 'START_CONVERSATION'; conversation: AIConversation }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: AIMessage }
  | { type: 'SET_CURRENT_CONVERSATION'; conversation: AIConversation | null };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'ADD_PRAYER':
      return { ...state, prayers: [action.prayer, ...state.prayers] };
    case 'UPDATE_PRAYER':
      return {
        ...state,
        prayers: state.prayers.map((p) =>
          p.id === action.id ? { ...p, ...action.updates } : p,
        ),
      };
    case 'DELETE_PRAYER':
      return {
        ...state,
        prayers: state.prayers.filter((p) => p.id !== action.id),
      };
    case 'SET_PRAYERS':
      return { ...state, prayers: action.prayers };
    case 'ADD_DEVOTIONAL':
      return { ...state, devotionals: [action.devotional, ...state.devotionals] };
    case 'SET_DEVOTIONALS':
      return { ...state, devotionals: action.devotionals };
    case 'ADD_MOOD':
      return { ...state, moods: [action.mood, ...state.moods] };
    case 'SET_MOODS':
      return { ...state, moods: action.moods };
    case 'START_CONVERSATION':
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
        currentConversation: action.conversation,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, messages: [...c.messages, action.message] }
            : c,
        ),
        currentConversation:
          state.currentConversation?.id === action.conversationId
            ? {
                ...state.currentConversation,
                messages: [...state.currentConversation.messages, action.message],
              }
            : state.currentConversation,
      };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.conversation };
    default:
      return state;
  }
}

const initialState: DataState = {
  prayers: [],
  devotionals: [],
  moods: [],
  conversations: [],
  currentConversation: null,
};

interface DataContextValue {
  state: DataState;
  addPrayer: (prayer: Omit<Prayer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Prayer;
  updatePrayer: (id: string, updates: Partial<Prayer>) => void;
  deletePrayer: (id: string) => void;
  markPrayerAnswered: (id: string, note?: string) => void;
  addDevotional: (devotional: Omit<Devotional, 'id' | 'user_id' | 'created_at'>) => void;
  addMood: (mood: MoodType, intensity: number, note?: string) => void;
  startConversation: () => AIConversation;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'created_at'>) => void;
  setCurrentConversation: (conversation: AIConversation | null) => void;
  getPrayersByCategory: (category: PrayerCategory) => Prayer[];
  getPrayersByStatus: (status: PrayerStatus) => Prayer[];
  getStreak: () => number;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const addPrayer = useCallback(
    (prayer: Omit<Prayer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Prayer => {
      const now = new Date().toISOString();
      const newPrayer: Prayer = {
        ...prayer,
        id: generateId(),
        user_id: 'local',
        created_at: now,
        updated_at: now,
      };
      dispatch({ type: 'ADD_PRAYER', prayer: newPrayer });
      return newPrayer;
    },
    [],
  );

  const updatePrayer = useCallback((id: string, updates: Partial<Prayer>) => {
    dispatch({ type: 'UPDATE_PRAYER', id, updates: { ...updates, updated_at: new Date().toISOString() } });
  }, []);

  const deletePrayer = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PRAYER', id });
  }, []);

  const markPrayerAnswered = useCallback((id: string, note?: string) => {
    dispatch({
      type: 'UPDATE_PRAYER',
      id,
      updates: {
        status: 'answered',
        answered_at: new Date().toISOString(),
        answered_note: note ?? null,
        updated_at: new Date().toISOString(),
      },
    });
  }, []);

  const addDevotional = useCallback(
    (devotional: Omit<Devotional, 'id' | 'user_id' | 'created_at'>) => {
      const newDevotional: Devotional = {
        ...devotional,
        id: generateId(),
        user_id: 'local',
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_DEVOTIONAL', devotional: newDevotional });
    },
    [],
  );

  const addMood = useCallback((mood: MoodType, intensity: number, note?: string) => {
    const entry: MoodEntry = {
      id: generateId(),
      user_id: 'local',
      mood,
      intensity,
      note: note ?? null,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MOOD', mood: entry });
  }, []);

  const startConversation = useCallback((): AIConversation => {
    const conversation: AIConversation = {
      id: generateId(),
      user_id: 'local',
      title: 'New Conversation',
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dispatch({ type: 'START_CONVERSATION', conversation });
    return conversation;
  }, []);

  const addMessage = useCallback(
    (conversationId: string, message: Omit<AIMessage, 'id' | 'created_at'>) => {
      const newMessage: AIMessage = {
        ...message,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', conversationId, message: newMessage });
    },
    [],
  );

  const setCurrentConversation = useCallback(
    (conversation: AIConversation | null) => {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', conversation });
    },
    [],
  );

  const getPrayersByCategory = useCallback(
    (category: PrayerCategory) => state.prayers.filter((p) => p.category === category),
    [state.prayers],
  );

  const getPrayersByStatus = useCallback(
    (status: PrayerStatus) => state.prayers.filter((p) => p.status === status),
    [state.prayers],
  );

  const getStreak = useCallback(() => {
    if (state.prayers.length === 0) return 0;

    const sorted = [...state.prayers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasPrayer = sorted.some(
        (p) => p.created_at.split('T')[0] === dateStr,
      );

      if (hasPrayer) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }, [state.prayers]);

  const value = useMemo(
    () => ({
      state,
      addPrayer,
      updatePrayer,
      deletePrayer,
      markPrayerAnswered,
      addDevotional,
      addMood,
      startConversation,
      addMessage,
      setCurrentConversation,
      getPrayersByCategory,
      getPrayersByStatus,
      getStreak,
    }),
    [
      state,
      addPrayer,
      updatePrayer,
      deletePrayer,
      markPrayerAnswered,
      addDevotional,
      addMood,
      startConversation,
      addMessage,
      setCurrentConversation,
      getPrayersByCategory,
      getPrayersByStatus,
      getStreak,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
