'use client';

import { useEffect } from 'react';
import { useGateStore } from '@/store/useGateStore';

export default function ZustandHydration({ children }: { children: React.ReactNode }) {
  const setHasHydrated = useGateStore((state) => state.setHasHydrated);

  useEffect(() => {
    // Manually trigger hydration on mount to prevent SSR mismatch
    const hydrate = async () => {
      await useGateStore.persist.rehydrate();
      setHasHydrated(true);
    };
    hydrate();
  }, [setHasHydrated]);

  return <>{children}</>;
}
