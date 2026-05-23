import { useCallback, useEffect, useState } from 'react';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import {
  getPrevoyanceMaintienEmployeurSettings,
  getPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';

export function usePrevoyanceSettings() {
  const [regimes, setRegimes] = useState<PrevoyanceRegimeSettings[]>([]);
  const [maintien, setMaintien] = useState<PrevoyanceMaintienEmployeurSettings[]>([]);
  const [loading, setLoading] = useState(true);

  const applySettings = useCallback(
    ([nextRegimes, nextMaintien]: [
      PrevoyanceRegimeSettings[],
      PrevoyanceMaintienEmployeurSettings[],
    ]) => {
      setRegimes(nextRegimes);
      setMaintien(nextMaintien);
    },
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await Promise.all([
        getPrevoyanceRegimeSettings(),
        getPrevoyanceMaintienEmployeurSettings(),
      ]);
      applySettings(payload);
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getPrevoyanceRegimeSettings(), getPrevoyanceMaintienEmployeurSettings()])
      .then((payload) => {
        if (!mounted) return;
        applySettings(payload);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [applySettings]);

  return { regimes, maintien, loading, reload };
}
