import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { getMe, GetMeOutputType } from 'zitejs/api';

type Ctx = { me: GetMeOutputType | null; loading: boolean; refresh: () => Promise<void> };
const FarmContext = createContext<Ctx>({ me: null, loading: true, refresh: async () => {} });

export function FarmProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<GetMeOutputType | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setMe(await getMe({}));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return <FarmContext.Provider value={{ me, loading, refresh }}>{children}</FarmContext.Provider>;
}

export const useFarm = () => useContext(FarmContext);
