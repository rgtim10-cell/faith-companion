import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { defaultRealm, realms } from '@/design/realms';
import type { RealmConfig, RealmKey } from '@/design/realms';

interface RealmContextValue {
  realm: RealmConfig;
  realmKey: RealmKey;
  setRealm: (key: RealmKey) => void;
}

const RealmContext = createContext<RealmContextValue | null>(null);

export function RealmProvider({ children }: { children: React.ReactNode }) {
  const [realmKey, setRealmKey] = useState<RealmKey>(defaultRealm);

  const setRealm = useCallback((key: RealmKey) => {
    setRealmKey(key);
  }, []);

  const value = useMemo(
    () => ({ realm: realms[realmKey], realmKey, setRealm }),
    [realmKey, setRealm],
  );

  return <RealmContext.Provider value={value}>{children}</RealmContext.Provider>;
}

export function useRealm(): RealmContextValue {
  const ctx = useContext(RealmContext);
  if (!ctx) throw new Error('useRealm must be used inside RealmProvider');
  return ctx;
}
