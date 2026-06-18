import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Covenant, ManifestationFeedback, MemoryRecord, MemoryType, ReinforcementReason } from '@/data/memoryGraph';
import type { RealmKey } from '@/design/realms';
import { reinforcementBoost, shouldBeFoundational } from '@/engine/memoryEvolution';

// Lightweight in-memory store with an AsyncStorage-compatible interface.
// Swap getItem/setItem for AsyncStorage calls to add cross-session persistence.
const _store = new Map<string, string>();
const storage = {
  getItem: async (key: string): Promise<string | null> => _store.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => { _store.set(key, value); },
};

const COVENANT_KEY = 'oath:covenant';
const MEMORIES_KEY = 'oath:memories';
const FEEDBACK_KEY = 'oath:feedback';

function buildSeedMemories(covenantId: string): MemoryRecord[] {
  const now = Date.now();
  const ago = (d: number) => now - d * 24 * 60 * 60 * 1000;
  return [
    {
      id: 'seed_1',
      type: 'promise',
      title: 'Founding oath',
      content: 'I want to become someone I could be proud of.',
      date: ago(67),
      emotionalWeight: 1,
      tags: ['identity', 'commitment'],
      linkedPromiseId: covenantId,
      source: 'covenant',
      realm: 'presence',
    },
    {
      id: 'seed_2',
      type: 'struggle',
      title: 'After the Denver setback',
      content: "I won't let one miss define me.",
      date: ago(31),
      emotionalWeight: 0.9,
      tags: ['resilience'],
      linkedPromiseId: covenantId,
      source: 'communion',
      realm: 'mission_control',
    },
    {
      id: 'seed_3',
      type: 'truth',
      title: 'Evening vulnerability',
      content: '9 PM is when my resolve weakens. I need to protect that hour.',
      date: ago(19),
      emotionalWeight: 0.7,
      tags: ['pattern', 'energy'],
      source: 'communion',
      realm: 'alignment',
    },
    {
      id: 'seed_4',
      type: 'breakthrough',
      title: 'After the hardest week',
      content: 'Discipline is just delayed gratification. I can delay.',
      date: ago(8),
      emotionalWeight: 0.85,
      tags: ['discipline', 'mindset'],
      linkedPromiseId: covenantId,
      source: 'communion',
      realm: 'presence',
    },
    {
      id: 'seed_5',
      type: 'evidence',
      title: 'First client signed',
      content: 'Signed the first client. Proof that the work is real and that I can build something.',
      date: ago(14),
      emotionalWeight: 0.95,
      tags: ['milestone', 'proof'],
      linkedPromiseId: covenantId,
      source: 'evidence_upload',
      realm: 'mission_control',
    },
    {
      id: 'seed_6',
      type: 'breakthrough',
      title: 'Morning rhythm locked in',
      content: 'Six missions, six days. The discipline is becoming who I am.',
      date: ago(4),
      emotionalWeight: 0.8,
      tags: ['consistency', 'identity'],
      linkedPromiseId: covenantId,
      source: 'communion',
      realm: 'future_self',
    },
    {
      id: 'seed_7',
      type: 'reflection',
      title: 'Night reflection',
      content: 'Slower start today but finished anyway. Showing up at 70% still counts.',
      date: ago(2),
      emotionalWeight: 0.6,
      tags: ['self-compassion'],
      source: 'night_reflection',
      realm: 'alignment',
    },
  ];
}

interface CovenantContextValue {
  covenant: Covenant | null;
  memories: MemoryRecord[];
  feedback: ManifestationFeedback[];
  isLoading: boolean;
  createCovenant: (promise: string) => Promise<Covenant>;
  addMemory: (input: {
    type: MemoryType;
    title: string;
    content: string;
    emotionalWeight?: number;
    tags?: string[];
    linkedPromiseId?: string;
    source: MemoryRecord['source'];
    realm?: RealmKey;
    oathInterpretation?: string;
    imageUri?: string;
  }) => MemoryRecord;
  addFeedback: (input: Omit<ManifestationFeedback, 'date'>) => void;
  reinforceMemory: (id: string, reason: ReinforcementReason) => void;
}

const CovenantContext = createContext<CovenantContextValue | null>(null);

export function CovenantProvider({ children }: { children: React.ReactNode }) {
  const [covenant, setCovenant] = useState<Covenant | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [feedback, setFeedback] = useState<ManifestationFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [covenantRaw, memoriesRaw, feedbackRaw] = await Promise.all([
          storage.getItem(COVENANT_KEY),
          storage.getItem(MEMORIES_KEY),
          storage.getItem(FEEDBACK_KEY),
        ]);
        if (covenantRaw) setCovenant(JSON.parse(covenantRaw) as Covenant);
        if (memoriesRaw) setMemories(JSON.parse(memoriesRaw) as MemoryRecord[]);
        if (feedbackRaw) setFeedback(JSON.parse(feedbackRaw) as ManifestationFeedback[]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const createCovenant = useCallback(async (promise: string): Promise<Covenant> => {
    const c: Covenant = { id: `cov_${Date.now()}`, promise, createdAt: Date.now() };
    const seeds = buildSeedMemories(c.id);
    setCovenant(c);
    setMemories(seeds);
    await Promise.all([
      storage.setItem(COVENANT_KEY, JSON.stringify(c)),
      storage.setItem(MEMORIES_KEY, JSON.stringify(seeds)),
    ]);
    return c;
  }, []);

  const addMemory = useCallback(
    (input: {
      type: MemoryType;
      title: string;
      content: string;
      emotionalWeight?: number;
      tags?: string[];
      linkedPromiseId?: string;
      source: MemoryRecord['source'];
      realm?: RealmKey;
      oathInterpretation?: string;
      imageUri?: string;
    }): MemoryRecord => {
      const record: MemoryRecord = {
        id: `mem_${Date.now()}`,
        type: input.type,
        title: input.title,
        content: input.content,
        date: Date.now(),
        emotionalWeight: input.emotionalWeight ?? 0.5,
        tags: input.tags ?? [],
        linkedPromiseId: input.linkedPromiseId,
        source: input.source,
        realm: input.realm,
        oathInterpretation: input.oathInterpretation,
        imageUri: input.imageUri,
      };
      setMemories((prev) => {
        const next = [record, ...prev];
        storage.setItem(MEMORIES_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return record;
    },
    [],
  );

  const addFeedback = useCallback((input: Omit<ManifestationFeedback, 'date'>) => {
    const f: ManifestationFeedback = { ...input, date: Date.now() };
    setFeedback((prev) => {
      const next = [f, ...prev];
      storage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reinforceMemory = useCallback((id: string, reason: ReinforcementReason) => {
    setMemories((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const patch = reinforcementBoost(target, reason);
      const updated: MemoryRecord = { ...target, ...patch };
      const withFoundational: MemoryRecord = shouldBeFoundational(updated)
        ? { ...updated, isFoundational: true }
        : updated;
      const next = [...prev];
      next[idx] = withFoundational;
      storage.setItem(MEMORIES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ covenant, memories, feedback, isLoading, createCovenant, addMemory, addFeedback, reinforceMemory }),
    [covenant, memories, feedback, isLoading, createCovenant, addMemory, addFeedback, reinforceMemory],
  );

  return <CovenantContext.Provider value={value}>{children}</CovenantContext.Provider>;
}

export function useCovenant(): CovenantContextValue {
  const ctx = useContext(CovenantContext);
  if (!ctx) throw new Error('useCovenant must be used inside CovenantProvider');
  return ctx;
}
