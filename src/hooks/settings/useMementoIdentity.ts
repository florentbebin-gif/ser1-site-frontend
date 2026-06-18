import { useEffect, useState } from 'react';

import {
  getMementoIdentity,
  subscribeMementoReferenceValuesInvalidation,
  type MementoIdentity,
} from '@/utils/cache/mementoReferenceValuesCache';

const EMPTY_MEMENTO_IDENTITY: MementoIdentity = { updatedAt: null, hash: '' };

/**
 * Expose l'identité (empreinte + updatedAt) du millésime courant de la base mémento, pour
 * l'injecter dans l'identité fiscale des snapshots `.ser1`. Volontairement hors `useFiscalContext`
 * (hook chaud des simulateurs) : la base mémento n'a pas à être chargée dans le contrat fiscal.
 */
export function useMementoIdentity(): MementoIdentity {
  const [identity, setIdentity] = useState<MementoIdentity>(EMPTY_MEMENTO_IDENTITY);

  useEffect(() => {
    let active = true;

    const refresh = (force: boolean): void => {
      void getMementoIdentity({ force }).then((next) => {
        if (active) setIdentity(next);
      });
    };

    refresh(false);
    const unsubscribe = subscribeMementoReferenceValuesInvalidation(() => refresh(true));

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return identity;
}
